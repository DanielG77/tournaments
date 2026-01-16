import asyncpg
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from domain.entities.tournament import Tournament
from domain.repositories.tournament_repository import TournamentRepository
from infrastructure.database.connection import DatabaseConnection

class TournamentRepositoryImpl(TournamentRepository):
    """PostgreSQL implementation of TournamentRepository"""
    
    async def get_all(self) -> List[Tournament]:
        async with DatabaseConnection.get_connection() as conn:
            rows = await conn.fetch("SELECT * FROM tournaments ORDER BY created_at DESC;")
            return [self._row_to_entity(row) for row in rows]
    
    async def get_by_id(self, tournament_id: UUID) -> Optional[Tournament]:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM tournaments WHERE id = $1;",
                tournament_id
            )
            return self._row_to_entity(row) if row else None
    
    # async def save(self, tournament: Tournament) -> Tournament:
    #     # Implementation for save/update
    #     pass
    
    # async def delete(self, tournament_id: UUID) -> bool:
    #     # Implementation for delete
    #     pass
    
    def _row_to_entity(self, row: asyncpg.Record) -> Tournament:
        """Convert database row to domain entity"""
        return Tournament(
            id=row['id'],
            name=row['name'],
            start_date=row['start_date'],
            end_date=row.get('end_date'),
            location=row.get('location'),
            created_at=row.get('created_at'),
            updated_at=row.get('updated_at')
        )