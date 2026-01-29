# src/infrastructure/repositories/dashboard_player/pokemon_team_repository_impl.py

from uuid import UUID
from typing import List, Optional
from infrastructure.database.connection import DatabaseConnection


class PokemonTeamRepositoryImpl:

    def __init__(self):
        self._pool = DatabaseConnection.get_pool()

    async def create_team(
        self,
        owner_user_id: UUID,
        name: str,
        is_public: bool = False
    ) -> UUID:
        sql = """
        INSERT INTO pokemon_teams (owner_user_id, name, is_public)
        VALUES ($1, $2, $3)
        RETURNING id;
        """
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(sql, owner_user_id, name, is_public)
            return row["id"]

    async def get_team_by_id(self, team_id: UUID) -> Optional[dict]:
        sql = """
        SELECT *
        FROM pokemon_teams
        WHERE id = $1;
        """
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(sql, team_id)
            return dict(row) if row else None

    async def list_teams_by_owner(self, owner_user_id: UUID) -> List[dict]:
        sql = """
        SELECT *
        FROM pokemon_teams
        WHERE owner_user_id = $1
        ORDER BY created_at DESC;
        """
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(sql, owner_user_id)
            return [dict(r) for r in rows]

    async def delete_team(self, team_id: UUID) -> None:
        sql = "DELETE FROM pokemon_teams WHERE id = $1;"
        async with self._pool.acquire() as conn:
            await conn.execute(sql, team_id)
