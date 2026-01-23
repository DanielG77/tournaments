from typing import List, Optional
from uuid import UUID
from application.schemas.admin.tournaments import TournamentCreate, TournamentOut, TournamentUpdate
from infrastructure.repositories.admin.tournaments_repo import (
    insert_tournament,
    fetch_tournaments,
    fetch_tournament_by_id,
    update_tournament as repo_update_tournament,
    soft_delete_tournament as repo_soft_delete,
)




async def create_tournament(payload: TournamentCreate, actor_user_id: str) -> TournamentOut:
    row = await insert_tournament(payload)
    return TournamentOut(**row)




async def list_tournaments(skip: int = 0, limit: int = 50) -> List[TournamentOut]:
    rows = await fetch_tournaments(skip, limit)
    return [TournamentOut(**r) for r in rows]




async def get_tournament(tournament_id: UUID) -> Optional[TournamentOut]:
    row = await fetch_tournament_by_id(tournament_id)
    if not row:
        return None
    return TournamentOut(**row)




async def update_tournament(tournament_id: UUID, payload: TournamentUpdate) -> Optional[TournamentOut]:
    row = await repo_update_tournament(tournament_id, payload)
    if not row:
        return None
    return TournamentOut(**row)




async def soft_delete_tournament(tournament_id: UUID) -> bool:
    return await repo_soft_delete(tournament_id)