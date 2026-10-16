from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from db.database import get_db, engine

router = APIRouter(prefix="/projetos", tags=["Projetos e Iniciativas"])

@router.get("/")
def listar_projetos(db: Session = Depends(get_db)):
    query = text("SELECT * FROM projeto ORDER BY id_projeto")
    try:
        with engine.connect() as connection:
            result = connection.execute(query)
            projetos = result.mappings().all()
            return projetos
    except SQLAlchemyError as erro:
        return {"error": f"Erro ao consultar o banco: {erro}"}