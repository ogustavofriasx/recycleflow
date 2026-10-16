from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from db.database import get_db, engine

router = APIRouter(prefix="/instituicao", tags=["Instituições"])

@router.get("/")
def listar_instituicoes(db: Session = Depends(get_db)):
    query = text("SELECT * FROM instituicao ORDER BY id_instituicao")
    try:
        with engine.connect() as connection:
            result = connection.execute(query)
            instituicoes = result.mappings().all()
            return instituicoes
    except SQLAlchemyError as erro:
        return {"error": f"Erro ao consultar o banco: {erro}"}