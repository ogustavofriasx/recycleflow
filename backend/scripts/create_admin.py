import getpass
import re
import sys

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from db.database import SessionLocal, engine
from security import hash_password


def main():
    nome = input("Nome do administrador: ").strip()
    email = input("E-mail do administrador: ").strip().lower()
    senha = getpass.getpass("Senha (mínimo 12 caracteres): ")
    confirmacao = getpass.getpass("Confirme a senha: ")

    if not nome or len(nome) > 150:
        raise SystemExit("Informe um nome com até 150 caracteres.")
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise SystemExit("Informe um e-mail válido.")
    if len(email) > 255:
        raise SystemExit("O e-mail deve ter até 255 caracteres.")
    if len(senha) < 12:
        raise SystemExit("A senha deve ter pelo menos 12 caracteres.")
    if len(senha) > 200:
        raise SystemExit("A senha deve ter até 200 caracteres.")
    if senha != confirmacao:
        raise SystemExit("As senhas não conferem.")

    db = SessionLocal()
    try:
        existing = db.execute(
            text("SELECT id_usuario FROM usuario WHERE lower(email) = lower(:email)"),
            {"email": email},
        ).first()
        if existing:
            raise SystemExit("Esse e-mail já possui uma conta. Nenhum dado foi alterado.")

        db.execute(
            text("""
                INSERT INTO usuario (nome, email, senha, papel, ativo)
                VALUES (:nome, :email, :senha, 'admin', TRUE)
            """),
            {"nome": nome, "email": email, "senha": hash_password(senha)},
        )
        db.commit()
        print(f"Administrador criado para {email}.")
    except IntegrityError:
        db.rollback()
        raise SystemExit("Não foi possível criar a conta: o e-mail já está cadastrado.")
    except SQLAlchemyError as erro:
        db.rollback()
        print(f"Erro ao criar administrador: {type(erro).__name__}", file=sys.stderr)
        raise SystemExit(1)
    finally:
        db.close()
        engine.dispose()


if __name__ == "__main__":
    main()
