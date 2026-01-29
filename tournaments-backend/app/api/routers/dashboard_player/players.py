# api/routers/dashboard_player/players.py
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Path
from application.schemas.dashboard_player.player import (
    UserCreate, UserResponse, PlayerProfileCreate, 
    PlayerProfileResponse, PlayerDashboardResponse
)
from application.schemas.dashboard_player.team import TeamResponse, UserTeamResponse
from application.schemas.dashboard_player.game_account import GameAccountResponse
from application.services.dashboard_player.player_service import PlayerService
from infrastructure.repositories.dashboard_player.user_repository_impl import (
    UserRepositoryImpl, PlayerProfileRepositoryImpl
)
from infrastructure.repositories.dashboard_player.team_repository_impl import TeamRepositoryImpl
from infrastructure.repositories.dashboard_player.game_account_repository_impl import GameAccountRepositoryImpl

router = APIRouter(prefix="/players", tags=["players"])

def get_player_service():
    return PlayerService(
        user_repo=UserRepositoryImpl(),
        profile_repo=PlayerProfileRepositoryImpl(),
        team_repo=TeamRepositoryImpl(),
        game_account_repo=GameAccountRepositoryImpl()
    )

# TODO: Implementar autenticación real
def get_current_user_id() -> UUID:
    # Por ahora, devolvemos un ID hardcodeado
    # En producción, extraer de JWT token
    return UUID("22222222-2222-2222-2222-222222222222")

# Dependencia para obtener el user_id de la ruta (para rutas con UUID)
async def get_player_user_id(user_id: UUID = Path(..., description="Player UUID")):
    return user_id

# ==================== RUTAS PÚBLICAS (sin auth) ====================

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_player(
    user_data: UserCreate,
    service: PlayerService = Depends(get_player_service)
):
    """
    Crear un nuevo jugador.
    """
    try:
        return await service.create_user(user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# ==================== RUTAS PARA EL USUARIO ACTUAL (/me) ====================

@router.get("/me", response_model=PlayerDashboardResponse)
async def get_my_dashboard(
    current_user_id: UUID = Depends(get_current_user_id),
    service: PlayerService = Depends(get_player_service)
):
    """
    Obtener el dashboard del jugador actualmente autenticado.
    """
    try:
        return await service.get_player_dashboard(current_user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.put("/me/profile", response_model=PlayerProfileResponse)
async def update_my_profile(
    profile_data: PlayerProfileCreate,
    current_user_id: UUID = Depends(get_current_user_id),
    service: PlayerService = Depends(get_player_service)
):
    """
    Actualizar el perfil del jugador actualmente autenticado.
    """
    try:
        return await service.update_player_profile(current_user_id, profile_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/me/teams", response_model=List[UserTeamResponse])
async def get_my_teams(
    current_user_id: UUID = Depends(get_current_user_id),
    team_repo: TeamRepositoryImpl = Depends(TeamRepositoryImpl)
):
    """
    Obtener todos los equipos del jugador actualmente autenticado.
    """
    teams = await team_repo.find_by_user(current_user_id)
    return teams

@router.get("/me/game-accounts", response_model=List[GameAccountResponse])
async def get_my_game_accounts(
    current_user_id: UUID = Depends(get_current_user_id),
    account_repo: GameAccountRepositoryImpl = Depends(GameAccountRepositoryImpl)
):
    """
    Obtener todas las cuentas de juego del jugador actualmente autenticado.
    """
    accounts = await account_repo.find_by_user_id(current_user_id)
    return accounts

# ==================== RUTAS ADMIN/PÚBLICAS (con UUID) ====================

@router.get("/{user_id}", response_model=PlayerDashboardResponse)
async def get_player_dashboard(
    user_id: UUID = Depends(get_player_user_id),
    service: PlayerService = Depends(get_player_service)
):
    """
    Obtener el dashboard de un jugador específico por su UUID.
    (Para admin o perfiles públicos)
    """
    try:
        return await service.get_player_dashboard(user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.get("/{user_id}/teams", response_model=List[UserTeamResponse])
async def get_player_teams(
    user_id: UUID = Depends(get_player_user_id),
    team_repo: TeamRepositoryImpl = Depends(TeamRepositoryImpl)
):
    """
    Obtener todos los equipos de un jugador específico por su UUID.
    """
    teams = await team_repo.find_by_user(user_id)
    return teams

@router.get("/{user_id}/game-accounts", response_model=List[GameAccountResponse])
async def get_player_game_accounts(
    user_id: UUID = Depends(get_player_user_id),
    account_repo: GameAccountRepositoryImpl = Depends(GameAccountRepositoryImpl)
):
    """
    Obtener todas las cuentas de juego de un jugador específico por su UUID.
    """
    accounts = await account_repo.find_by_user_id(user_id)
    return accounts