# src/api/dependencies/auth.py
from fastapi import Depends, HTTPException, Header
from typing import Optional, Dict, Any
from core.security import decode_token
from config.settings import settings
import jwt

async def get_bearer_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if parts[0].lower() != "bearer" or len(parts) != 2:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = parts[1]
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

# Obtener user completo (opcional: carga desde DB si quieres)
async def get_current_user(token_payload: dict = Depends(get_bearer_token)):
    return token_payload
