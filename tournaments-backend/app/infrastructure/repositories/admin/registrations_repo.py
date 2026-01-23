from typing import List, Optional
from uuid import UUID
from infrastructure.database.connection import DatabaseConnection


async def fetch_registrations(status: Optional[str], skip: int, limit: int) -> List[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        if status:
            rows = await conn.fetch("SELECT * FROM tournaments_participants WHERE status = $1 ORDER BY applied_at DESC OFFSET $2 LIMIT $3", status, skip, limit)
        else:
            rows = await conn.fetch("SELECT * FROM tournaments_participants ORDER BY applied_at DESC OFFSET $1 LIMIT $2", skip, limit)
        return [dict(r) for r in rows]




async def update_registration_review(participant_id: UUID, payload, reviewer_id: str) -> Optional[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE tournaments_participants SET status = $1, reviewed_at = now(), reviewed_by = $2, rejection_reason = $3 WHERE id = $4 RETURNING *",
            payload.status,
            reviewer_id,
            payload.rejection_reason,
            str(participant_id),
        )
    return dict(row) if row else None




async def insert_participant(tournament_id: UUID, team_id: UUID) -> dict:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO tournaments_participants (tournament_id, team_id, status, applied_at) VALUES ($1,$2,'pending', now()) RETURNING *",
            str(tournament_id),
            str(team_id),
        )
        return dict(row)




async def update_participant_status(participant_id: UUID, payload, reviewer_id: str) -> Optional[dict]:
    # Reuse same query as review
    return await update_registration_review(participant_id, payload, reviewer_id)