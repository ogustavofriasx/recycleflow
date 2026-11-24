from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from db.database import get_db
from schemas import Erro, Material, MaterialDetalhe

router = APIRouter(prefix="/materiais", tags=["Materiais"])

# Campos devolvidos para o frontend (mesma forma na lista e no detalhe)
CAMPOS_MATERIAL = """
    m.id_material, m.nome, m.descricao, m.reciclavel, m.tipo_descarte,
    m.instrucoes_preparo, m.cuidados, m.palavras_chave, m.destaque,
    m.fonte_url, m.verificado_em,
    m.id_categoria, c.nome AS categoria, c.icone AS categoria_icone, c.cor_hex AS categoria_cor
"""

# Busca no nome do material e nas palavras-chave,
# sem maiúsculas e sem acentos ("ÓLEO", "oleo" e "óleo" dão no mesmo)
FILTRO_BUSCA = """
    AND (
        CAST(:busca AS TEXT) IS NULL
        OR unaccent(lower(m.nome)) LIKE '%' || unaccent(lower(CAST(:busca AS TEXT))) || '%'
        OR EXISTS (
            SELECT 1 FROM unnest(m.palavras_chave) AS p
            WHERE unaccent(lower(p)) LIKE '%' || unaccent(lower(CAST(:busca AS TEXT))) || '%'
        )
    )
"""


def erro_banco(erro: SQLAlchemyError):
    # Loga o detalhe no servidor e devolve 500 sem expor o SQL para o cliente
    print(f"Erro ao consultar o banco: {erro}")
    raise HTTPException(status_code=500, detail="Erro ao consultar o banco de dados")


@router.get(
    "/",
    response_model=list[Material],
    summary="Buscar materiais",
    description="Sem `busca`, lista todos. Com `busca`, procura no nome e nas palavras-chave, "
    "sem diferenciar maiúsculas e acentos (`remedio` encontra *Medicamentos*).",
)
def listar_materiais(
    busca: Optional[str] = Query(None, max_length=100, description="Texto buscado no nome e nas palavras-chave"),
    categoria: Optional[int] = Query(None, description="id_categoria"),
    incluir_demo: bool = Query(False, description="Inclui os registros [DEMO] do seed de testes"),
    db: Session = Depends(get_db),
):
    busca = busca.strip() if busca and busca.strip() else None
    query = text(f"""
        SELECT {CAMPOS_MATERIAL}
        FROM material m
        JOIN categoria_material c ON c.id_categoria = m.id_categoria
        WHERE m.ativo = TRUE
          AND (:incluir_demo OR m.nome NOT LIKE '[DEMO]%')
          AND (CAST(:categoria AS BIGINT) IS NULL OR m.id_categoria = :categoria)
          {FILTRO_BUSCA}
        ORDER BY
            -- nome que começa com o termo aparece primeiro
            (CAST(:busca AS TEXT) IS NOT NULL
             AND unaccent(lower(m.nome)) LIKE unaccent(lower(CAST(:busca AS TEXT))) || '%') DESC,
            unaccent(lower(m.nome))
    """)
    try:
        result = db.execute(query, {"busca": busca, "categoria": categoria, "incluir_demo": incluir_demo})
        return [dict(r) for r in result.mappings()]
    except SQLAlchemyError as erro:
        erro_banco(erro)


@router.get(
    "/{id_material}",
    response_model=MaterialDetalhe,
    responses={404: {"model": Erro}},
    summary="Detalhar um material",
    description="Orientações de descarte e os pontos de coleta que aceitam o material.",
)
def detalhar_material(id_material: int, db: Session = Depends(get_db)):
    query_material = text(f"""
        SELECT {CAMPOS_MATERIAL}
        FROM material m
        JOIN categoria_material c ON c.id_categoria = m.id_categoria
        WHERE m.id_material = :id AND m.ativo = TRUE
    """)
    # Pontos ativos que aceitam o material (tabela ponto_material)
    query_pontos = text("""
        SELECT p.id_ponto, p.nome, p.logradouro, p.numero, p.bairro, p.cidade,
               t.nome AS tipo, p.horario_descricao,
               ST_Y(p.localizacao::geometry) AS latitude,
               ST_X(p.localizacao::geometry) AS longitude
        FROM ponto_material pm
        JOIN ponto_coleta p ON p.id_ponto = pm.id_ponto
        JOIN tipo_ponto_coleta t ON t.id_tipo = p.id_tipo
        WHERE pm.id_material = :id AND p.ativo = TRUE
        ORDER BY p.nome
    """)
    try:
        material = db.execute(query_material, {"id": id_material}).mappings().first()
        if material is None:
            raise HTTPException(status_code=404, detail="Material não encontrado")
        pontos = db.execute(query_pontos, {"id": id_material}).mappings().all()
        return {**material, "pontos": [dict(p) for p in pontos]}
    except SQLAlchemyError as erro:
        erro_banco(erro)
