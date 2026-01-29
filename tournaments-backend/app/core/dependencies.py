# src/core/dependencies.py

from typing import Generator
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

import jwt

from config.settings import settings
from infrastructure.repositories.tournament_repository_impl import TournamentRepositoryImpl
from application.services.tournament_service import TournamentService

# -------------------------
# SECURITY (JWT)
# -------------------------
security = HTTPBearer()

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UUID:
    """
    Extrae el user_id desde el JWT.
    El token DEBE tener: { "sub": "<uuid>" }
    """
    token = credentials.credentials

    try:
         payload = jwt.decode(
             token,
             settings.JWT_SECRET_KEY,
             algorithms=["HS256"],
         )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user id",
        )

    try:
        return UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user id format",
        )

# -------------------------
# TOURNAMENT DEPENDENCIES
# -------------------------
def get_tournament_repository() -> TournamentRepositoryImpl:
    """Dependency for tournament repository"""
    return TournamentRepositoryImpl()

def get_tournament_service(
    repository: TournamentRepositoryImpl = Depends(get_tournament_repository),
) -> TournamentService:
    """Dependency for tournament service"""
    return TournamentService(repository)
