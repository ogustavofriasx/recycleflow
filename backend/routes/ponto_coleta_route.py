from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from db.database import get_db

router = APIRouter(prefix="/pontos-coleta", tags=["Pontos de Coleta"])

# Um ponto por linha, já com coordenadas em graus, horários e materiais aceitos
QUERY_PONTOS = """
    SELECT
        p.id_ponto, p.nome, t.nome AS tipo,
        p.logradouro, p.numero, p.complemento, p.bairro, p.cidade, p.estado, p.cep,
        ST_Y(p.localizacao::geometry) AS latitude,
        ST_X(p.localizacao::geometry) AS longitude,
        p.telefone, p.site_url, p.horario_descricao, p.observacoes, p.fonte_url, p.verificado_em,
        COALESCE((
            SELECT json_agg(json_build_object(
                       'dia_semana', h.dia_semana,
                       'abertura', to_char(h.hora_abertura, 'HH24:MI'),
                       'fechamento', to_char(h.hora_fechamento, 'HH24:MI'))
                   ORDER BY h.dia_semana, h.hora_abertura)
            FROM horario_ponto h WHERE h.id_ponto = p.id_ponto
        ), '[]'::json) AS horarios,
        COALESCE((
            SELECT json_agg(json_build_object('id_material', m.id_material, 'nome', m.nome)
                   ORDER BY m.nome)
            FROM ponto_material pm
            JOIN material m ON m.id_material = pm.id_material
            WHERE pm.id_ponto = p.id_ponto AND m.ativo = TRUE
        ), '[]'::json) AS materiais
    FROM ponto_coleta p
    JOIN tipo_ponto_coleta t ON t.id_tipo = p.id_tipo
    WHERE p.ativo = TRUE
      AND (:incluir_demo OR p.nome NOT LIKE '[DEMO]%')
"""


def erro_banco(erro: SQLAlchemyError):
    print(f"Erro ao consultar o banco: {erro}")
    raise HTTPException(status_code=500, detail="Erro ao consultar o banco de dados")


# Filtros opcionais; parâmetro vazio (NULL) não filtra nada.
# Bairro e tipo comparam sem maiúsculas e sem acentos ("cervezao" = "Cervezão").
FILTROS = """
      AND (CAST(:material AS BIGINT) IS NULL OR EXISTS (
            SELECT 1 FROM ponto_material pm
            WHERE pm.id_ponto = p.id_ponto AND pm.id_material = :material))
      AND (CAST(:bairro AS TEXT) IS NULL
           OR unaccent(lower(p.bairro)) = unaccent(lower(CAST(:bairro AS TEXT))))
      AND (CAST(:tipo AS TEXT) IS NULL
           OR unaccent(lower(t.nome)) = unaccent(lower(CAST(:tipo AS TEXT))))
"""


def limpar(valor: Optional[str]) -> Optional[str]:
    return valor.strip() if valor and valor.strip() else None


@router.get("/")
def listar_pontos_coleta(
    material: Optional[int] = Query(None, description="id_material: só pontos que aceitam esse material"),
    bairro: Optional[str] = Query(None, max_length=100, description="Nome do bairro"),
    tipo: Optional[str] = Query(None, max_length=100, description="Tipo do ponto, ex.: Ecoponto, Cooperativa"),
    incluir_demo: bool = Query(False, description="Inclui os registros [DEMO] do seed de testes"),
    db: Session = Depends(get_db),
):
    params = {
        "material": material,
        "bairro": limpar(bairro),
        "tipo": limpar(tipo),
        "incluir_demo": incluir_demo,
    }
    try:
        query = text(QUERY_PONTOS + FILTROS + " ORDER BY p.nome")
        return db.execute(query, params).mappings().all()
    except SQLAlchemyError as erro:
        erro_banco(erro)


@router.get("/{id_ponto}")
def detalhar_ponto_coleta(id_ponto: int, db: Session = Depends(get_db)):
    try:
        query = text(QUERY_PONTOS + " AND p.id_ponto = :id")
        ponto = db.execute(query, {"incluir_demo": True, "id": id_ponto}).mappings().first()
    except SQLAlchemyError as erro:
        erro_banco(erro)
    if ponto is None:
        raise HTTPException(status_code=404, detail="Ponto de coleta não encontrado")
    return ponto
