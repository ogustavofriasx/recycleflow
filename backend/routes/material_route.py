from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from db.database import get_db, engine

router = APIRouter(prefix="/materiais", tags=["Materiais"])

@router.get("/")
def listar_materiais(db: Session = Depends(get_db)):
    query = text("SELECT * FROM material ORDER BY id_material")
    try:
        with engine.connect() as connection:
            result = connection.execute(query)
            materiais = result.mappings().all()
            return materiais
    except SQLAlchemyError as erro:
        return {"error": f"Erro ao consultar o banco: {erro}"}