from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("URL")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def materiais():
    """Imprime os materiais cadastrados. Uso: dentro de backend/, `python -m db.database`."""
    query = text("SELECT * FROM material ORDER BY id_material")

    try:
        with engine.connect() as connection:
            result = connection.execute(query)
            materiais = result.mappings().all()

            for material in materiais:
                print(f"ID: {material['id_material']}")
                print(f"Nome: {material['nome']}")
                print(f"Descrição: {material['descricao']}")
                print(f"Reciclável: {material['reciclavel']}")
                print(f"Tipo de descarte: {material['tipo_descarte']}")

    except SQLAlchemyError as erro:
        print(f"Erro ao consultar o banco: {erro}")


# Só roda quando o arquivo é executado direto, não quando a API importa o módulo
if __name__ == "__main__":
    materiais()
    engine.dispose()
