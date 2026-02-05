from typing import List, Optional
from uuid import UUID
from infrastructure.repositories.admin.players_repo import (
    fetch_players,
    fetch_player_detail,
    update_player_full_profile
)
from application.schemas.admin.players import PlayerOut
from application.schemas.admin.players import PlayerProfileUpdate, PlayerProfileResponse
from application.services.auth_service import AuthService

async def list_players(skip: int, limit: int) -> List[PlayerOut]:
    rows = await fetch_players(skip, limit)
    return [PlayerOut(**r) for r in rows]

async def get_player_detail(user_id: UUID):
    return await fetch_player_detail(user_id)

from core.security import hash_password

async def update_player_profile(user_id: UUID, profile_data: PlayerProfileUpdate) -> PlayerProfileResponse:
    """
    Actualiza el nickname y la contraseña del jugador de forma transaccional.
    """
    pwd_hash = None
    if profile_data.password:
        pwd_hash = hash_password(profile_data.password)

    # Llamamos al repo que hace la transacción
    try:
        updated_data = await update_player_full_profile(user_id, profile_data.nickname, pwd_hash)
    except Exception as e:
        # Check for unique violation (postgres error code 23505) in exception message or type if possible.
        # Asyncpg exceptions might need specific import, but generally string matching works for a quick check or let it bubble up.
        # But user requested handling duplicate nickname with 400.
        # Since we don't have the exact asyncpg error types imported here easily without adding imports, 
        # we can check the string representation or just let the router handle it if it was a ValueError.
        # Converting valid known database integrity errors to ValueError for the service layer is good practice.
        if "unique constraint" in str(e).lower() and "nickname" in str(e).lower():
            raise ValueError("Nickname already exists")
        raise e

    if not updated_data:
        raise ValueError("Player not found or update failed")

    return PlayerProfileResponse(**updated_data)
