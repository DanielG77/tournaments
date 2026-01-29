# tournaments-backend/app/application/services/admin/teams_service.py
from typing import List, Optional
from uuid import UUID
from application.schemas.admin.teams import TeamOut, TeamMemberOut, TeamMemberStatus
from infrastructure.database.connection import DatabaseConnection
from asyncpg import Record

# Helper to convert DB row to TeamMemberOut dict
def _member_record_to_dict(rec: Record) -> dict:
    return {
        "user_id": rec["user_id"],
        "user_name": rec.get("user_name"),
        "role": rec["role"],
        "status": rec["status"],
        "joined_at": rec.get("joined_at"),
        "left_at": rec.get("left_at"),
        "requested_by": rec.get("requested_by"),
        "requested_at": rec.get("requested_at"),
    }

async def list_teams(skip: int = 0, limit: int = 20):
    async with DatabaseConnection.get_connection() as conn:
        rows = await conn.fetch(
            """
            SELECT id, name, created_at
            FROM teams
            ORDER BY created_at DESC
            OFFSET $1
            LIMIT $2
            """,
            skip,
            limit,
        )

        return [
            {
                "id": row["id"],
                "name": row["name"],
                "created_at": row["created_at"],
            }
            for row in rows
        ]

async def get_team(team_id: UUID) -> Optional[dict]:
    async with DatabaseConnection.get_connection() as conn:
        t = await conn.fetchrow(
            """
            SELECT id, name, owner_user_id, coach_user_id, created_at, status, is_active
            FROM teams
            WHERE id = $1
            """,
            team_id,
        )
        if not t:
            return None

        members = await conn.fetch(
            """
            SELECT tm.user_id,
                   pp.nickname AS user_name,
                   tm.role,
                   tm.status,
                   tm.joined_at,
                   tm.left_at,
                   tm.requested_by,
                   tm.requested_at
            FROM team_members tm
            LEFT JOIN player_profiles pp ON pp.user_id = tm.user_id
            WHERE tm.team_id = $1
            ORDER BY tm.joined_at ASC
            """,
            team_id,
        )

        members_list = [_member_record_to_dict(m) for m in members]
        return {
            "id": t["id"],
            "name": t["name"],
            "owner_user_id": t["owner_user_id"],
            "coach_user_id": t["coach_user_id"],
            "members": members_list,
            "created_at": t["created_at"],
            "status": t["status"],
            "is_active": t["is_active"],
        }

async def add_team_member(team_id: UUID, user_id_to_add: UUID, role: str = "member") -> dict:
    """
    Inserta en team_members con status 'pending' por defecto y devuelve la fila creada.
    """
    async with DatabaseConnection.get_connection() as conn:
        rec = await conn.fetchrow(
            """
            INSERT INTO team_members (team_id, user_id, role, status, joined_at, requested_at)
            VALUES ($1, $2, $3, $4, now(), now())
            RETURNING team_id, user_id, role, status, joined_at, left_at, requested_by, requested_at
            """,
            team_id,
            user_id_to_add,
            role,
            TeamMemberStatus.pending.value,
        )

        user_row = await conn.fetchrow(
            "SELECT nickname FROM player_profiles WHERE user_id = $1", user_id_to_add
        )
        user_name = user_row["nickname"] if user_row else None
        return {
            "user_id": rec["user_id"],
            "user_name": user_name,
            "role": rec["role"],
            "status": rec["status"],
            "joined_at": rec["joined_at"],
            "left_at": rec["left_at"],
            "requested_by": rec["requested_by"],
            "requested_at": rec["requested_at"],
        }

async def remove_team_member(team_id: UUID, member_user_id: UUID) -> bool:
    async with DatabaseConnection.get_connection() as conn:
        res = await conn.execute(
            """
            DELETE FROM team_members
            WHERE team_id = $1 AND user_id = $2
            """,
            team_id,
            member_user_id,
        )
        return res.startswith("DELETE") and not res.endswith(" 0")

async def update_team_member_status(team_id: UUID, member_user_id: UUID, new_status: str, admin_user_id: Optional[str] = None) -> Optional[dict]:
    if new_status not in {s.value for s in TeamMemberStatus}:
        return None

    async with DatabaseConnection.get_connection() as conn:
        rec = await conn.fetchrow(
            """
            UPDATE team_members
            SET status = $1, requested_by = $2
            WHERE team_id = $3 AND user_id = $4
            RETURNING team_id, user_id, role, status, joined_at, left_at, requested_by, requested_at
            """,
            new_status,
            admin_user_id,
            team_id,
            member_user_id,
        )
        if not rec:
            return None

        user_row = await conn.fetchrow(
            "SELECT nickname FROM player_profiles WHERE user_id = $1", rec["user_id"]
        )
        user_name = user_row["nickname"] if user_row else None
        return {
            "user_id": rec["user_id"],
            "user_name": user_name,
            "role": rec["role"],
            "status": rec["status"],
            "joined_at": rec["joined_at"],
            "left_at": rec["left_at"],
            "requested_by": rec["requested_by"],
            "requested_at": rec["requested_at"],
        }

async def update_team(team_id: UUID, payload) -> Optional[dict]:
    async with DatabaseConnection.get_connection() as conn:
        await conn.execute(
            """
            UPDATE teams
            SET name = COALESCE($1, name),
                coach_user_id = COALESCE($2, coach_user_id),
                is_active = COALESCE($3, is_active)
            WHERE id = $4
            """,
            payload.name,
            payload.coach_user_id,
            payload.is_active,
            team_id,
        )
        return await get_team(team_id)

async def deactivate_team(team_id: UUID) -> bool:
    async with DatabaseConnection.get_connection() as conn:
        res = await conn.execute("UPDATE teams SET is_active = false WHERE id = $1", team_id)
        return res.startswith("UPDATE")
