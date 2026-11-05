from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from db.database import get_db
from schemas import Conteudo, ConteudoResumo, Erro

router = APIRouter(prefix="/conteudos", tags=["Conteúdos Educacionais"])


def erro_banco(erro: SQLAlchemyError):
    print(f"Erro ao consultar o banco: {erro}")
    raise HTTPException(status_code=500, detail="Erro ao consultar o banco de dados")


@router.get(
    "/",
    response_model=list[ConteudoResumo],
    summary="Listar conteúdos educativos",
    description="Conteúdos **publicados**, sem o texto completo (use `/conteudos/{slug}`).",
)
def listar_conteudos(db: Session = Depends(get_db)):
    query = text("""
        SELECT id_conteudo, titulo, slug, resumo, tipo, imagem_url, publicado_em
        FROM conteudo_educativo
        WHERE publicado = TRUE
        ORDER BY publicado_em DESC NULLS LAST, titulo
    """)
    try:
        return [dict(r) for r in db.execute(query).mappings()]
    except SQLAlchemyError as erro:
        erro_banco(erro)


@router.get(
    "/{slug}",
    response_model=Conteudo,
    responses={404: {"model": Erro}},
    summary="Ler um conteúdo",
    description="Texto completo de um conteúdo publicado e os materiais relacionados a ele.",
)
def detalhar_conteudo(slug: str, db: Session = Depends(get_db)):
    query = text("""
        SELECT c.id_conteudo, c.titulo, c.slug, c.resumo, c.tipo, c.imagem_url, c.publicado_em,
               c.corpo, c.fonte_url,
               COALESCE((
                   SELECT json_agg(json_build_object('id_material', m.id_material, 'nome', m.nome)
                          ORDER BY m.nome)
                   FROM material_conteudo mc
                   JOIN material m ON m.id_material = mc.id_material
                   WHERE mc.id_conteudo = c.id_conteudo AND m.ativo = TRUE
               ), '[]'::json) AS materiais
        FROM conteudo_educativo c
        WHERE c.slug = :slug AND c.publicado = TRUE
    """)
    try:
        conteudo = db.execute(query, {"slug": slug}).mappings().first()
    except SQLAlchemyError as erro:
        erro_banco(erro)
    if conteudo is None:
        raise HTTPException(status_code=404, detail="Conteúdo não encontrado")
    return dict(conteudo)
