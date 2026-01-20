from fastapi import APIRouter, Depends, Header, HTTPException, status, Path
from typing import Optional, List
from uuid import UUID

from application.services.dashboard_coach.coach_service import CoachService
from infrastructure.repositories.dashboard_coach.coach_repository_impl import CoachRepositoryImpl

router = APIRouter(prefix="/coach", tags=["coach"])

# --- CONSTANTES DE TEST (cambios mínimos) ---
DEFAULT_COACH_ID = "11111111-1111-1111-1111-111111111111"
DEFAULT_TEAM_ID  = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
DEFAULT_PLAYER_ID= "22222222-2222-2222-2222-222222222222"
# ------------------------------------------------

# Dependencia simple para obtener coach_user_id (temporal mientras no haya auth)
async def get_coach_user_id(x_user_id: Optional[str] = Header(None), user_id: Optional[str] = None):
    # Permitimos probar vía query param user_id (ej: ?user_id=...)
    # Si no envías ni header ni query param, usamos DEFAULT_COACH_ID (fallback mínimo para pruebas)
    uid = x_user_id or user_id or DEFAULT_COACH_ID
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="X-User-Id header or user_id query param required for coach endpoints")
    try:
        return UUID(uid)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user id")

# Instanciación: aquí puedes inyectar con DI real; por ahora creamos el impl directo
repo = CoachRepositoryImpl()
service = CoachService(repo)

@router.get("/profile")
async def get_profile(coach_user_id: UUID = Depends(get_coach_user_id)):
    profile = await service.get_profile(coach_user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Coach not found")
    return profile

@router.get("/teams")
async def list_teams(coach_user_id: UUID = Depends(get_coach_user_id)):
    teams = await service.get_my_teams(coach_user_id)
    return {"teams": teams}

@router.get("/teams/{team_id}")
async def team_detail(team_id: UUID = Path(...), coach_user_id: UUID = Depends(get_coach_user_id)):
    team = await service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    # comprobación: solo el coach asignado puede ver (si quieres restringir)
    if team["coach_user_id"] and str(team["coach_user_id"]) != str(coach_user_id):
        raise HTTPException(status_code=403, detail="Not coach of this team")
    return team

@router.get("/teams/{team_id}/players")
async def team_players(team_id: UUID = Path(...), coach_user_id: UUID = Depends(get_coach_user_id)):
    # opcional: validar coach ownership
    team = await service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team["coach_user_id"] and str(team["coach_user_id"]) != str(coach_user_id):
        raise HTTPException(status_code=403, detail="Not coach of this team")
    players = await service.get_players_of_team(team_id)
    return {"players": players}

@router.get("/players/{user_id}/game-accounts")
async def player_game_accounts(user_id: UUID, coach_user_id: UUID = Depends(get_coach_user_id)):
    # could validate coach has some relation to the player; omitted for brevity
    accounts = await service.get_game_accounts(user_id)
    return {"game_accounts": accounts}

@router.delete("/teams/{team_id}/leave", status_code=204)
async def leave_team(team_id: UUID = Path(...), coach_user_id: UUID = Depends(get_coach_user_id)):
    ok = await service.leave_team(coach_user_id, team_id)

    if not ok:
        # no era coach o no existe
        raise HTTPException(status_code=400, detail="Could not leave team (not coach or invalid team)")
    return

@router.get("/teams/{team_id}/history")
async def team_history(team_id: UUID = Path(...), coach_user_id: UUID = Depends(get_coach_user_id)):
    team = await service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team["coach_user_id"] and str(team["coach_user_id"]) != str(coach_user_id):
        raise HTTPException(status_code=403, detail="Not coach of this team")
    history = await service.get_team_history(team_id)
    return {"history": history}

@router.get("/teams/{team_id}/tournaments")
async def team_tournaments(team_id: UUID = Path(...), coach_user_id: UUID = Depends(get_coach_user_id)):
    team = await service.get_team(team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    if team["coach_user_id"] and str(team["coach_user_id"]) != str(coach_user_id):
        raise HTTPException(status_code=403, detail="Not coach of this team")
    tournaments = await service.get_tournaments_for_team(team_id)
    return {"tournaments": tournaments}
