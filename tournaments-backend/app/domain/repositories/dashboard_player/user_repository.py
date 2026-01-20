from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from domain.entities.dashboard_player.user import User, PlayerProfile

class UserRepository(ABC):
    @abstractmethod
    async def find_by_id(self, user_id: UUID) -> Optional[User]:
        pass
    
    @abstractmethod
    async def find_by_email(self, email: str) -> Optional[User]:
        pass
    
    @abstractmethod
    async def save(self, user: User) -> User:
        pass
    
    @abstractmethod
    async def update_last_login(self, user_id: UUID) -> None:
        pass

class PlayerProfileRepository(ABC):
    @abstractmethod
    async def find_by_user_id(self, user_id: UUID) -> Optional[PlayerProfile]:
        pass
    
    @abstractmethod
    async def save(self, profile: PlayerProfile) -> PlayerProfile:
        pass
    
    @abstractmethod
    async def update(self, profile: PlayerProfile) -> PlayerProfile:
        pass