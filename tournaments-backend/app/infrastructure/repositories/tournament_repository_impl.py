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

    def _row_to_entity(self, row: asyncpg.Record) -> Tournament:
        """Convert database row to domain entity"""
        # Map DB column 'end_at' -> entity.end_date
        t = Tournament(
            id=row['id'],
            name=row['name'],
            start_at=row['start_at'],
            end_date=row.get('end_at'),          # <-- usar la columna real de la BD
            location=row.get('location'),
            created_at=row.get('created_at'),
        )

        # Adjuntamos el flag almacenado en la BD para que el serializador lo incluya.
        # Esto añade un atributo dinámico 'is_active' a la instancia.
        # (asi evitamos tener que cambiar la firma del dataclass).
        if 'is_active' in row:
            setattr(t, 'is_active', row.get('is_active'))
        else:
            # Fallback: si no hay columna en la fila, calculamoslo a partir de fechas
            setattr(t, 'is_active', t.is_active())

        return t
