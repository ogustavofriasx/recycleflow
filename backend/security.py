import base64
import binascii
import hmac
import json
import os
import time

from argon2 import PasswordHasher, exceptions
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.database import get_db

TOKEN_LIFETIME_SECONDS = 8 * 60 * 60
password_hasher = PasswordHasher()
bearer_scheme = HTTPBearer(auto_error=False)


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(password: str, encoded: str) -> bool:
    try:
        return password_hasher.verify(encoded, password)
    except (exceptions.VerifyMismatchError, exceptions.InvalidHashError, exceptions.VerificationError):
        return False


def _token_secret() -> bytes:
    secret = os.getenv("ADMIN_TOKEN_SECRET", "")
    if len(secret) < 32:
        raise HTTPException(
            status_code=500,
            detail="ADMIN_TOKEN_SECRET deve conter pelo menos 32 caracteres",
        )
    return secret.encode("utf-8")


def create_access_token(user_id: int) -> str:
    header = _b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64encode(
        json.dumps(
            {"sub": str(user_id), "exp": int(time.time()) + TOKEN_LIFETIME_SECONDS},
            separators=(",", ":"),
        ).encode()
    )
    unsigned = f"{header}.{payload}"
    signature = hmac.new(_token_secret(), unsigned.encode("ascii"), "sha256").digest()
    return f"{unsigned}.{_b64encode(signature)}"


def decode_access_token(token: str) -> int:
    try:
        header_part, payload_part, signature_part = token.split(".")
        unsigned = f"{header_part}.{payload_part}"
        signature = _b64decode(signature_part)
        expected = hmac.new(_token_secret(), unsigned.encode("ascii"), "sha256").digest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("invalid signature")
        header = json.loads(_b64decode(header_part))
        payload = json.loads(_b64decode(payload_part))
        if header != {"alg": "HS256", "typ": "JWT"}:
            raise ValueError("invalid token header")
        user_id = int(payload["sub"])
        if payload["exp"] <= int(time.time()):
            raise ValueError("expired token")
        return user_id
    except (ValueError, TypeError, KeyError, binascii.Error, json.JSONDecodeError, UnicodeError):
        raise HTTPException(status_code=401, detail="Sessão inválida ou expirada")


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
):
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Autenticação necessária")
    user_id = decode_access_token(credentials.credentials)
    user = db.execute(
        text("SELECT id_usuario, nome, email, papel FROM usuario WHERE id_usuario = :id AND ativo = TRUE"),
        {"id": user_id},
    ).mappings().first()
    if user is None or user["papel"] != "admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    return dict(user)
