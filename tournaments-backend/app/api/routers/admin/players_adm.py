from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from application.schemas.admin.players import PlayerOut
from application.services.admin.players_service import list_players, get_player_detail
from api.dependencies.admin import get_admin_user


router = APIRouter(prefix="/admin/players", tags=["admin:players"])




@router.get("/", response_model=List[PlayerOut])
async def get_players(skip: int = 0, limit: int = 50, user_id: str = Depends(get_admin_user)):
    return await list_players(skip, limit)




@router.get("/{player_id}")
async def get_player(player_id: UUID, user_id: str = Depends(get_admin_user)):
    out = await get_player_detail(player_id)
    if not out:
        raise HTTPException(status_code=404, detail="Player not found")
    return out