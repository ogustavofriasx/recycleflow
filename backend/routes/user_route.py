from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.database import get_db
from security import require_admin

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


@router.get("/")
def listar_usuarios(_: dict = Depends(require_admin), db: Session = Depends(get_db)):
    query = text("""
        SELECT id_usuario, nome, email, papel, ativo, criado_em, atualizado_em
        FROM usuario ORDER BY id_usuario
    """)
    return [dict(row) for row in db.execute(query).mappings()]