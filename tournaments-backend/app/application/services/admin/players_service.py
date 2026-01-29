from typing import List, Optional
from uuid import UUID
from infrastructure.repositories.admin.players_repo import (
    fetch_players,
    fetch_player_detail,
)
from application.schemas.admin.players import PlayerOut




async def list_players(skip: int, limit: int) -> List[PlayerOut]:
    rows = await fetch_players(skip, limit)
    return [PlayerOut(**r) for r in rows]

async def get_player_detail(user_id: UUID):
    return await fetch_player_detail(user_id)