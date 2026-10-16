from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from db.database import get_db, engine

router = APIRouter(prefix="/pontos-coleta", tags=["Pontos de Coleta"])

@router.get("/")
def listar_pontos_coleta(db: Session = Depends(get_db)):
    query = text("SELECT * FROM ponto_coleta ORDER BY id_ponto")
    try:
        with engine.connect() as connection:
            result = connection.execute(query)
            pontos_coleta = result.mappings().all()
            return pontos_coleta
    except SQLAlchemyError as erro:
        return {"error": f"Erro ao consultar o banco: {erro}"}