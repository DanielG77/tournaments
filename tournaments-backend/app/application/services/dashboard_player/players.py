from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from application.schemas.dashboard_player.player import (
    UserCreate, UserResponse, PlayerProfileCreate, 
    PlayerProfileResponse, PlayerDashboardResponse
)
from application.schemas.dashboard_player.team import TeamResponse
from application.schemas.dashboard_player.game_account import GameAccountResponse, GameAccountCreate
from application.services.dashboard_player.player_service import PlayerService
from infrastructure.repositories.dashboard_player.user_repository_impl import UserRepositoryImpl
from infrastructure.repositories.dashboard_player.player_profile_repository_impl import PlayerProfileRepositoryImpl
from infrastructure.repositories.dashboard_player.team_repository_impl import TeamRepositoryImpl
from infrastructure.repositories.dashboard_player.game_account_repository_impl import GameAccountRepositoryImpl
from core.security import hash_password, verify_password, create_access_token, create_refresh_token

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
    return UUID("12345678-1234-1234-1234-123456789012")

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_player(
    user_data: UserCreate,
    service: PlayerService = Depends(get_player_service)
):
    try:
        return await service.create_user(user_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/me", response_model=PlayerDashboardResponse)
async def get_my_dashboard(
    user_id: UUID = Depends(get_current_user_id),
    service: PlayerService = Depends(get_player_service)
):
    try:
        return await service.get_player_dashboard(user_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.put("/me/profile", response_model=PlayerProfileResponse)
async def update_my_profile(
    profile_data: PlayerProfileCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: PlayerService = Depends(get_player_service)
):
    try:
        return await service.update_player_profile(user_id, profile_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/me/teams", response_model=List[TeamResponse])
async def get_my_teams(
    user_id: UUID = Depends(get_current_user_id),
    team_repo: TeamRepositoryImpl = Depends(TeamRepositoryImpl)
):
    teams = await team_repo.find_by_user_id(user_id)
    return teams

@router.get("/me/game-accounts", response_model=List[GameAccountResponse])
async def get_my_game_accounts(
    user_id: UUID = Depends(get_current_user_id),
    account_repo: GameAccountRepositoryImpl = Depends(GameAccountRepositoryImpl)
):
    accounts = await account_repo.find_by_user_id(user_id)
    return accounts

@router.post("/me/game-accounts", 
             response_model=GameAccountResponse, 
             status_code=status.HTTP_201_CREATED)
async def register_game_account(
    account_data: GameAccountCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: PlayerService = Depends(get_player_service)
):
    try:
        return await service.register_game_account(user_id, account_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    

