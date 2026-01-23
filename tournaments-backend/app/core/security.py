# src/core/security.py
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import bcrypt
import jwt

from config.settings import settings

import uuid

# Passwords
def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None, jti: Optional[str] = None) -> str:
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta is None:
        expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    expire = now + expires_delta
    if jti is None:
        jti = str(uuid.uuid4())
    to_encode.update({"exp": expire, "iat": now, "type": "refresh", "jti": jti})
    token = jwt.encode(to_encode, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.utcnow()
    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = now + expires_delta
    to_encode.update({"exp": expire, "iat": now, "type": "access"})
    token = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token

def decode_token(token: str, verify_refresh: bool = False) -> Dict[str, Any]:
    secret = settings.JWT_REFRESH_SECRET_KEY if verify_refresh else settings.JWT_SECRET_KEY
    payload = jwt.decode(token, secret, algorithms=[settings.JWT_ALGORITHM])
    return payload