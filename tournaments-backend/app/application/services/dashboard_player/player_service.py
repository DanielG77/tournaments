from typing import Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from domain.repositories.dashboard_player.user_repository import UserRepository, PlayerProfileRepository
from domain.repositories.dashboard_player.team_repository import TeamRepository
from domain.repositories.dashboard_player.game_account_repository import GameAccountRepository
from application.schemas.dashboard_player.player import (
    UserCreate, UserResponse, PlayerProfileCreate, 
    PlayerProfileResponse, PlayerDashboardResponse
)
from application.schemas.dashboard_player.game_account import GameAccountCreate, GameAccountResponse
import bcrypt

class PlayerService:
    def __init__(
        self,
        user_repo: UserRepository,
        profile_repo: PlayerProfileRepository,
        team_repo: TeamRepository,
        game_account_repo: GameAccountRepository
    ):
        self.user_repo = user_repo
        self.profile_repo = profile_repo
        self.team_repo = team_repo
        self.game_account_repo = game_account_repo
    
    @staticmethod
    def hash_password(password: str) -> str:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(
            password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    
    async def create_user(self, user_data: UserCreate) -> UserResponse:
        # Verificar si el usuario ya existe
        existing = await self.user_repo.find_by_email(user_data.email)
        if existing:
            raise ValueError("User already exists")
        
        # Crear usuario
        user_id = uuid4()
        now = datetime.now()
        
        user = await self.user_repo.save(
            type('User', (), {
                'id': user_id,
                'email': user_data.email,
                'password_hash': self.hash_password(user_data.password),
                'status': 'active',
                'is_active': True,
                'created_at': now,
                'updated_at': now,
                'last_login': None,
                'date_born': None,
                'avatar_url': None
            })()
        )
        
        return UserResponse(
            id=user.id,
            email=user.email,
            status=user.status,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login=user.last_login,
            date_born=user.date_born,
            avatar_url=user.avatar_url
        )
    
    async def get_player_dashboard(self, user_id: UUID) -> PlayerDashboardResponse:
        # Obtener usuario
        user = await self.user_repo.find_by_id(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Obtener perfil
        profile = await self.profile_repo.find_by_user_id(user_id)
        
        # Obtener conteos
        teams = await self.team_repo.find_by_user_id(user_id)
        game_accounts = await self.game_account_repo.find_by_user_id(user_id)
        
        # TODO: Obtener torneos (cuando implementes la tabla)
        tournaments_count = 0
        
        return PlayerDashboardResponse(
            user=UserResponse(
                id=user.id,
                email=user.email,
                status=user.status,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at,
                last_login=user.last_login,
                date_born=user.date_born,
                avatar_url=user.avatar_url
            ),
            profile=PlayerProfileResponse(
                user_id=profile.user_id,
                nickname=profile.nickname,
                created_at=profile.created_at,
                updated_at=profile.updated_at
            ) if profile else None,
            teams_count=len(teams),
            tournaments_count=tournaments_count,
            game_accounts_count=len(game_accounts)
        )
    
    async def update_player_profile(
        self, 
        user_id: UUID, 
        profile_data: PlayerProfileCreate
    ) -> PlayerProfileResponse:
        existing = await self.profile_repo.find_by_user_id(user_id)
        now = datetime.now()
        
        if existing:
            # Actualizar perfil existente
            updated_profile = await self.profile_repo.update(
                type('PlayerProfile', (), {
                    'user_id': user_id,
                    'nickname': profile_data.nickname,
                    'created_at': existing.created_at,
                    'updated_at': now
                })()
            )
        else:
            # Crear nuevo perfil
            updated_profile = await self.profile_repo.save(
                type('PlayerProfile', (), {
                    'user_id': user_id,
                    'nickname': profile_data.nickname,
                    'created_at': now,
                    'updated_at': now
                })()
            )
        
        return PlayerProfileResponse(
            user_id=updated_profile.user_id,
            nickname=updated_profile.nickname,
            created_at=updated_profile.created_at,
            updated_at=updated_profile.updated_at
        )
    
    async def register_game_account(
        self,
        user_id: UUID,
        account_data: GameAccountCreate
    ) -> GameAccountResponse:
        # Verificar si ya existe esta cuenta para el usuario
        existing_accounts = await self.game_account_repo.find_by_game_and_platform(
            user_id, account_data.game_key, account_data.platform
        )
        
        # Puedes añadir lógica para evitar duplicados si es necesario
        
        # Crear nueva cuenta
        account_id = uuid4()
        now = datetime.now()
        
        account = await self.game_account_repo.save(
            type('UserGameAccount', (), {
                'id': account_id,
                'user_id': user_id,
                'game_key': account_data.game_key,
                'platform': account_data.platform,
                'platform_account_id': account_data.platform_account_id,
                'display_name': account_data.display_name,
                'metadata': account_data.metadata,
                'created_at': now,
                'status': 'active',
                'is_active': True
            })()
        )
        
        return GameAccountResponse(
            id=account.id,
            user_id=account.user_id,
            game_key=account.game_key,
            platform=account.platform,
            platform_account_id=account.platform_account_id,
            display_name=account.display_name,
            metadata=account.metadata,
            created_at=account.created_at,
            status=account.status,
            is_active=account.is_active
        )