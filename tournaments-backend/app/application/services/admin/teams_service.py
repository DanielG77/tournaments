from typing import List, Optional
from uuid import UUID
from application.schemas.admin.teams import TeamOut, TeamUpdateIn
from infrastructure.repositories.admin.teams_repo import (
    fetch_teams,
    fetch_team_by_id,
    update_team as repo_update_team,
    deactivate_team as repo_deactivate_team,
    insert_team_member,
    delete_team_member,
)




async def list_teams(skip: int, limit: int) -> List[TeamOut]:
    rows = await fetch_teams(skip, limit)
    return [TeamOut(**r) for r in rows]




async def get_team(team_id: UUID) -> Optional[TeamOut]:
    row = await fetch_team_by_id(team_id)
    if not row:
        return None
    return TeamOut(**row)



async def update_team(team_id: UUID, payload: TeamUpdateIn) -> Optional[TeamOut]:
    row = await repo_update_team(team_id, payload)
    if not row:
        return None
    return TeamOut(**row)


async def deactivate_team(team_id: UUID) -> bool:
    return await repo_deactivate_team(team_id) 

async def add_team_member(team_id: UUID, user_id_to_add: UUID, role: str) -> None:
    await insert_team_member(team_id, user_id_to_add, role)




async def remove_team_member(team_id: UUID, member_user_id: UUID) -> bool:
    return await delete_team_member(team_id, member_user_id)