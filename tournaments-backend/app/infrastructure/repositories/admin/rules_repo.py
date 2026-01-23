from typing import List, Optional
from uuid import UUID
from infrastructure.database.connection import DatabaseConnection

async def insert_rule(tournament_id: UUID, key: Optional[str], content: str) -> dict:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("INSERT INTO tournament_rules (tournament_id, key, content) VALUES ($1,$2,$3) RETURNING *", str(tournament_id), key, content)
        return dict(row)



async def fetch_rules(tournament_id: UUID) -> List[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM tournament_rules WHERE tournament_id = $1 ORDER BY created_at", str(tournament_id))
        return [dict(r) for r in rows]