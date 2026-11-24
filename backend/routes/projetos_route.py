from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from db.database import get_db
from schemas import Erro, Projeto

router = APIRouter(prefix="/projetos", tags=["Projetos e Iniciativas"])

# Só projetos publicados, já com a instituição responsável
QUERY_PROJETOS = """
    SELECT pr.id_projeto, pr.titulo, pr.descricao, pr.tipo, pr.data_inicio, pr.data_fim,
           pr.fonte_url, pr.verificado_em, pr.id_instituicao,
           i.nome AS instituicao, i.tipo AS instituicao_tipo
    FROM projeto_iniciativa pr
    LEFT JOIN instituicao i ON i.id_instituicao = pr.id_instituicao
    WHERE pr.publicado = TRUE
"""


def erro_banco(erro: SQLAlchemyError):
    print(f"Erro ao consultar o banco: {erro}")
    raise HTTPException(status_code=500, detail="Erro ao consultar o banco de dados")


@router.get(
    "/",
    response_model=list[Projeto],
    summary="Listar projetos e iniciativas",
    description="Projetos **publicados**, ordenados do mais recente para o mais antigo.",
)
def listar_projetos(
    instituicao_tipo: Optional[str] = Query(
        None, max_length=60, description="Filtra pelo tipo da instituição, ex.: ONG, Cooperativa"
    ),
    db: Session = Depends(get_db),
):
    tipo = instituicao_tipo.strip() if instituicao_tipo and instituicao_tipo.strip() else None
    query = text(QUERY_PROJETOS + """
        AND (CAST(:tipo AS TEXT) IS NULL
             OR unaccent(lower(i.tipo)) = unaccent(lower(CAST(:tipo AS TEXT))))
        ORDER BY pr.data_inicio DESC NULLS LAST, pr.titulo
    """)
    try:
        return [dict(r) for r in db.execute(query, {"tipo": tipo}).mappings()]
    except SQLAlchemyError as erro:
        erro_banco(erro)


@router.get(
    "/{id_projeto}",
    response_model=Projeto,
    responses={404: {"model": Erro}},
    summary="Detalhar um projeto",
)
def detalhar_projeto(id_projeto: int, db: Session = Depends(get_db)):
    try:
        projeto = db.execute(
            text(QUERY_PROJETOS + " AND pr.id_projeto = :id"), {"id": id_projeto}
        ).mappings().first()
    except SQLAlchemyError as erro:
        erro_banco(erro)
    if projeto is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return dict(projeto)
