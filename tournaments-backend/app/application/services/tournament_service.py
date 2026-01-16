from typing import List
from uuid import UUID
from domain.entities.tournament import Tournament
from domain.repositories.tournament_repository import TournamentRepository
from application.schemas.tournament import TournamentCreate, TournamentUpdate

class TournamentService:
    """Application service for tournament operations"""
    
    def __init__(self, repository: TournamentRepository):
        self.repository = repository
    
    async def get_all_tournaments(self) -> List[Tournament]:
        """Get all tournaments"""
        return await self.repository.get_all()
    
    async def get_tournament_by_id(self, tournament_id: UUID) -> Tournament:
        """Get tournament by ID"""
        tournament = await self.repository.get_by_id(tournament_id)
        if not tournament:
            raise ValueError(f"Tournament with ID {tournament_id} not found")
        return tournament
    
    async def create_tournament(self, data: TournamentCreate) -> Tournament:
        """Create a new tournament"""
        # Here you would add business logic
        # For now, just pass through to repository
        pass
    
    async def update_tournament(self, tournament_id: UUID, data: TournamentUpdate) -> Tournament:
        """Update tournament"""
        pass