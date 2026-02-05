from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status, HTTPException
from application.schemas.admin.tournaments import (
TournamentCreate,
TournamentOut,
TournamentUpdate,
)
from application.services.admin.tournaments_service import (
    create_tournament as svc_create_tournament,
    list_tournaments as svc_list_tournaments,
    get_tournament as svc_get_tournament,
    update_tournament as svc_update_tournament,
    soft_delete_tournament as svc_soft_delete_tournament,
)
from api.dependencies.admin import get_admin_user


router = APIRouter(prefix="/admin/tournaments", tags=["admin:tournaments"])


@router.post("", response_model=TournamentOut, status_code=status.HTTP_201_CREATED)
async def create_tournament(payload: TournamentCreate, user_id: str = Depends(get_admin_user)):
    return await svc_create_tournament(payload, user_id)


@router.get("", response_model=List[TournamentOut])
async def list_tournaments(skip: int = 0, limit: int = 50, user_id: str = Depends(get_admin_user)):
    return await svc_list_tournaments(skip, limit)


@router.get("/{tournament_id}", response_model=TournamentOut)
async def get_tournament(tournament_id: UUID, user_id: str = Depends(get_admin_user)):
    out = await svc_get_tournament(tournament_id)
    if not out:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return out


@router.put("/{tournament_id}", response_model=TournamentOut)
async def update_tournament(tournament_id: UUID, payload: TournamentUpdate, user_id: str = Depends(get_admin_user)):
    out = await svc_update_tournament(tournament_id, payload)
    if not out:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return out


@router.delete("/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tournament(tournament_id: UUID, user_id: str = Depends(get_admin_user)):
    ok = await svc_soft_delete_tournament(tournament_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return None


@router.delete("/end/{tournament_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_def_tournament(tournament_id: UUID, user_id: str = Depends(get_admin_user)):
    ok = await svc_soft_delete_tournament(tournament_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return None