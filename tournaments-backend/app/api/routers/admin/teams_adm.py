# tournaments-backend/app/api/routers/admin/teams_adm.py
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from application.schemas.admin.teams import (
    TeamOut,
    TeamUpdateIn,
    TeamMemberCreate,
    TeamMemberOut,
    TeamMemberStatusUpdate,
    TeamAdminListResponse,
)
from application.services.admin.teams_service import (
    list_teams,
    get_team,
    update_team,
    deactivate_team,
    add_team_member,
    remove_team_member,
    update_team_member_status,
)
from api.dependencies.admin import get_admin_user


router = APIRouter(prefix="/admin/teams", tags=["admin:teams"])


@router.get("/",response_model=list[TeamAdminListResponse],)
async def get_teams(skip: int = 0, limit: int = 20):
    return await list_teams(skip, limit)



@router.get("/{team_id}", response_model=TeamOut)
async def get_team_endpoint(team_id: UUID, user_id: str = Depends(get_admin_user)):
    out = await get_team(team_id)
    if not out:
        raise HTTPException(status_code=404, detail="Team not found")
    return out


@router.put("/{team_id}", response_model=TeamOut)
async def put_team(team_id: UUID, payload: TeamUpdateIn, user_id: str = Depends(get_admin_user)):
    out = await update_team(team_id, payload)
    if not out:
        raise HTTPException(status_code=404, detail="Team not found")
    return out


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(team_id: UUID, user_id: str = Depends(get_admin_user)):
    ok = await deactivate_team(team_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Team not found")
    return None


@router.post("/{team_id}/members", response_model=TeamMemberOut, status_code=status.HTTP_201_CREATED)
async def post_add_member(team_id: UUID, payload: TeamMemberCreate, user_id: str = Depends(get_admin_user)):
    """
    Añade un miembro al equipo. El payload contiene user_id_to_add y role.
    El miembro se crea con status = 'pending' por defecto.
    """
    member = await add_team_member(team_id, payload.user_id_to_add, payload.role)
    return member


@router.delete("/{team_id}/members/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def del_remove_member(team_id: UUID, member_user_id: UUID, user_id: str = Depends(get_admin_user)):
    ok = await remove_team_member(team_id, member_user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Membership not found")
    return None


@router.put("/{team_id}/members/{member_user_id}/status", response_model=TeamMemberOut)
async def put_update_member_status(team_id: UUID, member_user_id: UUID, payload: TeamMemberStatusUpdate, user_id: str = Depends(get_admin_user)):
    """
    Cambia el status de un miembro (pending|active|rejected). Devuelve la fila actualizada.
    """
    member = await update_team_member_status(team_id, member_user_id, payload.status, user_id)
    if not member:
        raise HTTPException(status_code=404, detail="Membership not found")
    return member
