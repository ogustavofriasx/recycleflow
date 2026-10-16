from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from db.database import get_db, engine

router = APIRouter(prefix="/conteudos", tags=["Conteúdos Educacionais"])

@router.get("/")
def listar_conteudos(db: Session = Depends(get_db)):
    query = text("SELECT * FROM conteudo_educativo ORDER BY id_conteudo")
    try:
        with engine.connect() as connection:
            result = connection.execute(query)
            conteudos = result.mappings().all()
            return conteudos
    except SQLAlchemyError as erro:
        return {"error": f"Erro ao consultar o banco: {erro}"}