from typing import List, Optional
from uuid import UUID

from sqlalchemy import values
from infrastructure.database.connection import DatabaseConnection
from typing import Dict, Any, Optional
import logging
import datetime

logger = logging.getLogger(__name__)

async def fetch_players(skip: int, limit: int) -> List[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT u.id, u.email, pp.nickname, u.created_at FROM users u JOIN player_profiles pp ON pp.user_id = u.id ORDER BY u.created_at DESC OFFSET $1 LIMIT $2",
            skip,
            limit,
        )
        return [dict(r) for r in rows]




async def fetch_player_detail(user_id: UUID) -> Optional[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        user = await conn.fetchrow("SELECT u.*, pp.nickname FROM users u JOIN player_profiles pp ON pp.user_id = u.id WHERE u.id = $1", str(user_id))
        if not user:
            return None
        participations = await conn.fetch("SELECT * FROM tournaments_participants WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = $1) ORDER BY joined_at DESC", str(user_id))
        teams = await conn.fetch("SELECT t.* FROM teams t JOIN team_members tm ON tm.team_id = t.id WHERE tm.user_id = $1", str(user_id))
        return {"user": dict(user), "teams": [dict(t) for t in teams], "participations": [dict(p) for p in participations]}
    




async def update_player_full_profile(user_id: UUID, nickname: Optional[str], password_hash: Optional[str]) -> dict:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # 1. Update Password if provided
            if password_hash:
                await conn.execute("UPDATE users SET password_hash = $1 WHERE id = $2", password_hash, str(user_id))
            
            # 2. Update Nickname if provided
            if nickname is not None:
                # Validar duplicados (aunque la DB lanzaría error, es bueno saber qué pasó)
                # O simplemente dejar que la DB lance UniqueViolationError y el servicio lo capture
                await conn.execute("UPDATE player_profiles SET nickname = $1, updated_at = NOW() WHERE user_id = $2", nickname, str(user_id))
            
            # 3. Fetch updated data to return
            updated_row = await conn.fetchrow(
                """
                SELECT u.id as user_id, u.email, u.created_at, pp.nickname, pp.updated_at 
                FROM users u 
                JOIN player_profiles pp ON pp.user_id = u.id 
                WHERE u.id = $1
                """, 
                str(user_id)
            )
            
            if not updated_row:
                 # This might happen if the user doesn't have a profile anymore or user deleted
                return {}
                
            return dict(updated_row)