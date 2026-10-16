from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session, sessionmaker
from db.database import get_db, engine

router = APIRouter(prefix="/usuarios", tags=["Usuários"])

@router.get("/")
def listar_usuarios(db: Session = Depends(get_db)):
    query = text("SELECT * FROM usuario ORDER BY id_usuario")
    try:
        with engine.connect() as connection:
            result = connection.execute(query)
            usuarios = result.mappings().all()
            return usuarios
    except SQLAlchemyError as erro:
        return {"error": f"Erro ao consultar o banco: {erro}"}