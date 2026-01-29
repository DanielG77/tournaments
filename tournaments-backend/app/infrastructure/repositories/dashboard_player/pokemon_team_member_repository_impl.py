# src/infrastructure/repositories/dashboard_player/pokemon_team_member_repository_impl.py

from uuid import UUID
from typing import Optional, List
from infrastructure.database.connection import DatabaseConnection


class PokemonTeamMemberRepositoryImpl:

    def __init__(self):
        self._pool = DatabaseConnection.get_pool()

    async def list_members(self, pokemon_team_id: UUID) -> List[dict]:
        sql = """
        SELECT *
        FROM pokemon_team_members
        WHERE pokemon_team_id = $1
        ORDER BY position;
        """
        async with self._pool.acquire() as conn:
            rows = await conn.fetch(sql, pokemon_team_id)
            return [dict(r) for r in rows]

    async def get_member(self, member_id: int) -> Optional[dict]:
        sql = "SELECT * FROM pokemon_team_members WHERE id = $1;"
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(sql, member_id)
            return dict(row) if row else None

    async def add_member(
        self,
        pokemon_team_id: UUID,
        data: dict
    ) -> int:
        sql = """
        INSERT INTO pokemon_team_members (
            pokemon_team_id,
            position,
            pokemon_id,
            species_id,
            nickname,
            level,
            nature,
            ability,
            held_item,
            shiny,
            ivs,
            evs,
            moves
        ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
        )
        RETURNING id;
        """
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                sql,
                pokemon_team_id,
                data["position"],
                data["pokemon_id"],
                data.get("species_id"),
                data.get("nickname"),
                data.get("level", 50),
                data.get("nature"),
                data.get("ability"),
                data.get("held_item"),
                data.get("shiny", False),
                data.get("ivs", {}),
                data.get("evs", {}),
                data.get("moves", []),
            )
            return row["id"]

    async def update_member(self, member_id: int, data: dict) -> None:
        sql = """
        UPDATE pokemon_team_members
        SET
            nickname = $2,
            level = $3,
            nature = $4,
            ability = $5,
            held_item = $6,
            shiny = $7,
            ivs = $8,
            evs = $9,
            moves = $10
        WHERE id = $1;
        """
        async with self._pool.acquire() as conn:
            await conn.execute(
                sql,
                member_id,
                data.get("nickname"),
                data.get("level"),
                data.get("nature"),
                data.get("ability"),
                data.get("held_item"),
                data.get("shiny"),
                data.get("ivs"),
                data.get("evs"),
                data.get("moves"),
            )

    async def delete_member(self, member_id: int) -> None:
        sql = "DELETE FROM pokemon_team_members WHERE id = $1;"
        async with self._pool.acquire() as conn:
            await conn.execute(sql, member_id)
