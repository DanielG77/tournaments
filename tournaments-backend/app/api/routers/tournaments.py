from fastapi import APIRouter, Depends, HTTPException
from typing import List
import asyncpg

from application.services.tournament_service import TournamentService
from infrastructure.repositories.tournament_repository_impl import TournamentRepositoryImpl
from application.schemas.tournament import TournamentResponse
from core.dependencies import get_tournament_service

router = APIRouter(prefix="/tournaments", tags=["tournaments"])

@router.get("", response_model=List[TournamentResponse])
@router.get("/", response_model=List[TournamentResponse])
async def get_tournaments(
    service: TournamentService = Depends(get_tournament_service)
):
    """Get all tournaments"""
    try:
        tournaments = await service.get_all_tournaments()
        return tournaments
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
