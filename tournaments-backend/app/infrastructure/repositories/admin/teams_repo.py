from typing import List, Optional
from unittest import skip
from uuid import UUID
from infrastructure.database.connection import DatabaseConnection


async def fetch_teams(skip: int, limit: int) -> List[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM teams ORDER BY created_at DESC OFFSET $1 LIMIT $2", skip, limit)
        return [dict(r) for r in rows]




async def fetch_team_by_id(team_id: UUID) -> Optional[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM teams WHERE id = $1", str(team_id))
        return dict(row) if row else None




async def update_team(team_id: UUID, payload) -> Optional[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        set_parts = []
        args = []
        idx = 1
        for k, v in payload.dict(exclude_unset=True).items():
            set_parts.append(f"{k} = ${idx}")
            args.append(v)
            idx += 1
        if not set_parts:
            return None
        args.append(str(team_id))
        q = f"UPDATE teams SET {', '.join(set_parts)} WHERE id = ${idx} RETURNING *"
        row = await conn.fetchrow(q, *args)
        return dict(row) if row else None




async def deactivate_team(team_id: UUID) -> bool:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("UPDATE teams SET is_active = false WHERE id = $1", str(team_id))
        return not result.endswith("0")




async def insert_team_member(team_id: UUID, user_id: UUID, role: str) -> None:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO team_members (team_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT (team_id, user_id) DO UPDATE SET left_at = NULL, role = EXCLUDED.role, joined_at = now()",
            str(team_id),
            str(user_id),
            role,
        )




async def delete_team_member(team_id: UUID, user_id: UUID) -> bool:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        result = await conn.execute("DELETE FROM team_members WHERE team_id = $1 AND user_id = $2", str(team_id), str(user_id))
        return not result.endswith("0")