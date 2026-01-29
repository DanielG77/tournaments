# tournaments-backend/app/api/routers/dashboard_coach/coach.py
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query, Body
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel

from application.services.dashboard_coach.coach_service import CoachService
from infrastructure.repositories.dashboard_coach.coach_repository_impl import CoachRepositoryImpl

from application.schemas.dashboard_coach.coach import (
    TeamCreateRequest,
    TeamDetail,
    PlayerBasic,
)

router = APIRouter(prefix="/coach", tags=["coach"])

repo = CoachRepositoryImpl()
service = CoachService(repo)


# Dependencia simple: el coach_id viene por path
async def get_coach_user_id(coach_id: UUID = Path(..., description="Coach UUID")):
    return coach_id

@router.get("/{coach_id}/profile")
async def get_profile(coach_user_id: UUID = Depends(get_coach_user_id)):
    profile = await service.get_profile(coach_user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Coach not found")
    return profile


@router.get("/{coach_id}/teams")
async def list_teams(
    coach_id: UUID = Path(..., description="Coach ID from URL"),
    coach_user_id: UUID = Depends(get_coach_user_id)
):
    # Verificar que el coach de la URL sea el autenticado
    if str(coach_id) != str(coach_user_id):
        raise HTTPException(
            status_code=403, 
            detail="Can only list your own teams"
        )
    
    teams = await service.get_my_teams(coach_user_id)
    return {"teams": teams}


@router.get("/{coach_id}/teams/{team_id}")
async def team_detail(
    team_id: UUID = Path(...),
    coach_user_id: UUID = Depends(get_coach_user_id)
):
    team = await service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team["coach_user_id"] and str(team["coach_user_id"]) != str(coach_user_id):
        raise HTTPException(status_code=403, detail="Not coach of this team")
    return team


@router.get("/{coach_id}/teams/{team_id}/players")
async def team_players(
    team_id: UUID = Path(...),
    coach_user_id: UUID = Depends(get_coach_user_id)
):
    team = await service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team["coach_user_id"] and str(team["coach_user_id"]) != str(coach_user_id):
        raise HTTPException(status_code=403, detail="Not coach of this team")
    players = await service.get_players_of_team(team_id)
    return {"players": players}


@router.get("/{coach_id}/players/{user_id}/game-accounts")
async def player_game_accounts(
    user_id: UUID,
    coach_user_id: UUID = Depends(get_coach_user_id)
):
    accounts = await service.get_game_accounts(user_id)
    return {"game_accounts": accounts}


@router.delete("/{coach_id}/teams/{team_id}/leave", status_code=204)
async def leave_team(
    team_id: UUID = Path(...),
    coach_user_id: UUID = Depends(get_coach_user_id)
):
    ok = await service.leave_team(coach_user_id, team_id)

    if not ok:
        raise HTTPException(status_code=400, detail="Could not leave team (not coach or invalid team)")
    return


@router.get("/{coach_id}/teams/{team_id}/history")
async def team_history(
    team_id: UUID = Path(...),
    coach_user_id: UUID = Depends(get_coach_user_id)
):
    team = await service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team["coach_user_id"] and str(team["coach_user_id"]) != str(coach_user_id):
        raise HTTPException(status_code=403, detail="Not coach of this team")
    history = await service.get_team_history(team_id)
    return {"history": history}


@router.get("/{coach_id}/teams/{team_id}/tournaments")
async def team_tournaments(
    team_id: UUID = Path(...),
    coach_user_id: UUID = Depends(get_coach_user_id)
):
    team = await service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team["coach_user_id"] and str(team["coach_user_id"]) != str(coach_user_id):
        raise HTTPException(status_code=403, detail="Not coach of this team")
    tournaments = await service.get_tournaments_for_team(team_id)
    return {"tournaments": tournaments}



# Nuevos endpoints para estadísticas

@router.post("/{coach_id}/teams", response_model=TeamDetail, status_code=201)
async def create_team(
    payload: TeamCreateRequest = Body(...),
    coach_user_id: UUID = Depends(get_coach_user_id)
):
    """
    Crear un equipo. El coach autenticado será owner y coach del equipo.
    """
    team = await service.create_team(coach_user_id, payload)
    return team


@router.get("/{coach_id}/users", response_model=List[PlayerBasic])
async def get_users(
    limit: int = Query(20, gt=0, le=100),
    offset: int = Query(0, ge=0),
    coach_user_id: UUID = Depends(get_coach_user_id)
):
    """
    Obtiene listado completo de jugadores con perfil (INNER JOIN).
    Devuelve players básicos con game_accounts.
    """
    users = await service.search_users(limit=limit, offset=offset)
    return users


class AddPlayerPayload(BaseModel):
    user_id: UUID
    role: Optional[str] = "member"


@router.post("/{coach_id}/teams/{team_id}/players", status_code=201)
async def add_player_to_team(
    team_id: UUID = Path(...),
    payload: AddPlayerPayload = Body(...),
    coach_user_id: UUID = Depends(get_coach_user_id)
):
    ok = await service.add_player_to_team(
        coach_user_id,
        team_id,
        payload.user_id,
        payload.role
    )

    if not ok:
        raise HTTPException(
            status_code=400,
            detail="Could not add player (maybe not coach, already member or invalid IDs)"
        )

    return {"status": "player_added"}
