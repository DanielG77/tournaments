from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Path, Body, Response
from pydantic import BaseModel, Field

from application.schemas.admin.players import PlayerOut
from application.services.admin.players_service import list_players, get_player_detail
from api.dependencies.admin import get_admin_user
from infrastructure.repositories.dashboard_player.user_repository_impl import UserRepositoryImpl
from application.services.auth_service import AuthService

router = APIRouter(prefix="/admin/players", tags=["admin:players"])

def get_player_service():
    return None

@router.get("/", response_model=List[PlayerOut])
async def get_players(skip: int = 0, limit: int = 50, user_id: str = Depends(get_admin_user)):
    return await list_players(skip, limit)

@router.get("/{player_id}")
async def get_player(player_id: UUID, user_id: str = Depends(get_admin_user)):
    out = await get_player_detail(player_id)
    if not out:
        raise HTTPException(status_code=404, detail="Player not found")
    return out

class PasswordUpdate(BaseModel):
    password: str = Field(..., min_length=8, description="Nueva contraseña (mínimo 8 caracteres)")

@router.put("/{player_id}/password", status_code=status.HTTP_204_NO_CONTENT)
async def update_player_password(
    player_id: UUID = Path(..., description="ID del jugador cuyo password se quiere actualizar"),
    payload: PasswordUpdate = Body(...),
    admin_user: str = Depends(get_admin_user),
):
    """
    Actualiza la contraseña del usuario (tabla users).
    Solo accesible por admin (dependency get_admin_user).
    Devuelve 204 No Content si se actualiza correctamente.
    """

    user_repo = UserRepositoryImpl()

    # 1️⃣ Obtener usuario usando el método correcto del repositorio
    user = await user_repo.find_by_id(player_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2️⃣ Actualizar la contraseña usando AuthService
    try:
        # Usa AuthService.update_password que ya maneja el hashing
        await AuthService.update_password(str(player_id), payload.password)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to update password: {str(e)}"
        )

    # 3️⃣ Responder 204 No Content
    return Response(status_code=status.HTTP_204_NO_CONTENT)
