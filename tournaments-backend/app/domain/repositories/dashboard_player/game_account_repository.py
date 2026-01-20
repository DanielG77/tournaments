from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from domain.entities.dashboard_player.game_account import UserGameAccount

class GameAccountRepository(ABC):
    @abstractmethod
    async def find_by_user_id(self, user_id: UUID) -> List[UserGameAccount]:
        pass
    
    @abstractmethod
    async def find_by_id(self, account_id: UUID) -> Optional[UserGameAccount]:
        pass
    
    @abstractmethod
    async def save(self, account: UserGameAccount) -> UserGameAccount:
        pass
    
    @abstractmethod
    async def update(self, account: UserGameAccount) -> UserGameAccount:
        pass
    
    @abstractmethod
    async def delete(self, account_id: UUID) -> bool:
        pass