from typing import List, Optional
from uuid import UUID
from infrastructure.database.connection import DatabaseConnection




async def fetch_players(skip: int, limit: int) -> List[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT u.id, u.email, pp.nickname, u.created_at FROM users u LEFT JOIN player_profiles pp ON pp.user_id = u.id ORDER BY u.created_at DESC OFFSET $1 LIMIT $2",
            skip,
            limit,
        )
        return [dict(r) for r in rows]




async def fetch_player_detail(user_id: UUID) -> Optional[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT u.*, pp.nickname FROM users u LEFT JOIN player_profiles pp ON pp.user_id = u.id WHERE u.id = $1", str(user_id))
        if not user:
            return None
        participations = await conn.fetch("SELECT * FROM tournaments_participants WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = $1) ORDER BY joined_at DESC", str(user_id))
        teams = await conn.fetch("SELECT t.* FROM teams t JOIN team_members tm ON tm.team_id = t.id WHERE tm.user_id = $1", str(user_id))
        return {"user": dict(user), "teams": [dict(t) for t in teams], "participations": [dict(p) for p in participations]}