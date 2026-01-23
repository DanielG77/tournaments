from fastapi import Request, HTTPException, status
from typing import Optional

# JWT opcional (no existe en tu proyecto, así que queda en None)
try:
    from src.core.security import decode_jwt  # pragma: no cover
except Exception:  # pragma: no cover
    decode_jwt = None

from infrastructure.database.connection import DatabaseConnection


async def get_admin_user(request: Request) -> str:
    """
    Dependency que valida si el usuario es admin.

    Prioridad:
    1. JWT (Bearer) con role=admin (si decode_jwt existe)
    2. Header x-user-id contra tabla admin_profiles
    """

    pool = await DatabaseConnection.get_pool()

    # -------------------------------------------------
    # 1️⃣ Intentar JWT (si existe decode_jwt)
    # -------------------------------------------------
    auth_header: Optional[str] = request.headers.get("authorization")

    if (
        auth_header
        and auth_header.lower().startswith("bearer ")
        and decode_jwt is not None
    ):
        token = auth_header.split(" ", 1)[1]

        try:
            payload = decode_jwt(token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        user_id = payload.get("sub")
        roles = payload.get("roles", []) or []

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing subject",
            )

        # Si el JWT ya trae rol admin → OK
        if "admin" in roles:
            return user_id

        # Si no, comprobamos en DB
        async with pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT user_id FROM admin_profiles WHERE user_id = $1",
                user_id,
            )
            if row:
                return user_id

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not admin",
        )

    # -------------------------------------------------
    # 2️⃣ Fallback: header x-user-id (legacy / Postman)
    # -------------------------------------------------
    user_id = request.headers.get("x-user-id")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing credentials",
        )

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT user_id FROM admin_profiles WHERE user_id = $1",
            user_id,
        )

    if not row:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not admin",
        )

    return user_id
