import os
import logging
from datetime import datetime, timedelta
from jose import JWTError, jwt

# --- GLOBAL BCRYPT COMPATIBILITY PATCH ---
# Modern bcrypt (4.0.0+) throws ValueError for inputs > 72 bytes.
# Passlib's internal bug-detection check triggers this on Python 3.13.
# This patch ensures ALL bcrypt calls are safe.
try:
    import bcrypt
    if not hasattr(bcrypt, "_original_hashpw"):
        bcrypt._original_hashpw = bcrypt.hashpw
        def patched_hashpw(password, salt):
            if isinstance(password, str): password = password.encode("utf-8")
            return bcrypt._original_hashpw(password[:72], salt)
        bcrypt.hashpw = patched_hashpw

    if not hasattr(bcrypt, "_original_checkpw"):
        bcrypt._original_checkpw = bcrypt.checkpw
        def patched_checkpw(password, hashed_password):
            if isinstance(password, str): password = password.encode("utf-8")
            # We must also ensure hashed_password is bytes if the library is strict
            if isinstance(hashed_password, str): hashed_password = hashed_password.encode("utf-8")
            return bcrypt._original_checkpw(password[:72], hashed_password)
        bcrypt.checkpw = patched_checkpw
except ImportError:
    logging.warning("Bcrypt library not found, skipping patch.")
except Exception as e:
    logging.warning(f"Failed to apply bcrypt patch: {e}")
# -----------------------------------------

from passlib.context import CryptContext

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    # Our global patch handles truncation, but we keep it here for clarity
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    # Our global patch handles truncation
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
