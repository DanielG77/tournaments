from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from domain.entities.tournament import Tournament

class TournamentRepository(ABC):
    """Abstract base class for tournament repository"""
    
    @abstractmethod
    async def get_all(self) -> List[Tournament]:
        """Get all tournaments"""
        pass
    
    @abstractmethod
    async def get_by_id(self, tournament_id: UUID) -> Optional[Tournament]:
        """Get tournament by ID"""
        pass
    
    # @abstractmethod
    # async def save(self, tournament: Tournament) -> Tournament:
    #     """Save tournament"""
    #     pass
    
    # @abstractmethod
    # async def delete(self, tournament_id: UUID) -> bool:
    #     """Delete tournament"""
    #     pass