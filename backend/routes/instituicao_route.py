from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from db.database import get_db
from schemas import Erro, Instituicao

router = APIRouter(prefix="/instituicoes", tags=["Instituições"])

QUERY_INSTITUICOES = """
    SELECT id_instituicao, nome, tipo, descricao, telefone, email, site_url
    FROM instituicao
    WHERE ativo = TRUE
"""


def erro_banco(erro: SQLAlchemyError):
    print(f"Erro ao consultar o banco: {erro}")
    raise HTTPException(status_code=500, detail="Erro ao consultar o banco de dados")


@router.get(
    "/",
    response_model=list[Instituicao],
    summary="Listar instituições",
    description="Prefeitura, cooperativas, ONGs e empresas responsáveis por pontos e projetos.",
)
def listar_instituicoes(
    incluir_demo: bool = Query(False, description="Inclui os registros [DEMO] do seed de testes"),
    db: Session = Depends(get_db),
):
    query = text(QUERY_INSTITUICOES + " AND (:incluir_demo OR nome NOT LIKE '[DEMO]%') ORDER BY nome")
    try:
        return [dict(r) for r in db.execute(query, {"incluir_demo": incluir_demo}).mappings()]
    except SQLAlchemyError as erro:
        erro_banco(erro)


@router.get(
    "/{id_instituicao}",
    response_model=Instituicao,
    responses={404: {"model": Erro}},
    summary="Detalhar uma instituição",
)
def detalhar_instituicao(id_instituicao: int, db: Session = Depends(get_db)):
    try:
        instituicao = db.execute(
            text(QUERY_INSTITUICOES + " AND id_instituicao = :id"), {"id": id_instituicao}
        ).mappings().first()
    except SQLAlchemyError as erro:
        erro_banco(erro)
    if instituicao is None:
        raise HTTPException(status_code=404, detail="Instituição não encontrada")
    return dict(instituicao)
