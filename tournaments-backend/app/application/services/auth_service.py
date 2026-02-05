# src/application/services/auth_service.py
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, timezone
import uuid

from infrastructure.database.connection import DatabaseConnection
from core.security import hash_password, verify_password, create_access_token, create_refresh_token
from config.settings import settings
import asyncpg

class AuthService:
    @staticmethod
    async def register_user(email: str, password: str, role: str, nickname: Optional[str] = None) -> Dict[str, Any]:
        pwd_hash = hash_password(password)
        async with DatabaseConnection.get_connection() as conn:
            # Inserta usuario
            row = await conn.fetchrow(
                """
                INSERT INTO users (email, password_hash, role)
                VALUES ($1, $2, $3)
                RETURNING id, email, role, avatar_url
                """,
                email, pwd_hash, role
            )
            user_id = row["id"]

            # Crea profile según rol
            if role == "player":
                await conn.execute(
                    "INSERT INTO player_profiles (user_id, nickname) VALUES ($1, $2) ON CONFLICT DO NOTHING",
                    user_id, nickname
                )
            elif role == "coach":
                await conn.execute(
                    "INSERT INTO coach_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING",
                    user_id
                )
            elif role == "admin":
                await conn.execute(
                    "INSERT INTO admin_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING",
                    user_id
                )

            return dict(row)

    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                "SELECT id, email, password_hash, role, is_active FROM users WHERE email = $1",
                email
            )
            if not row:
                return None
            if not row["is_active"]:
                return None
            if not verify_password(password, row["password_hash"]):
                return None
            return dict(row)

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, email, role, avatar_url, is_active 
                FROM users 
                WHERE id = $1
                """,
                user_id
            )
            if not row or not row["is_active"]:
                return None
            return dict(row)

    async def create_tokens_for_user(user: Dict[str, Any], ip: Optional[str] = None, user_agent: Optional[str] = None, rotate_refresh: bool = True) -> Dict[str, Any]:
        user_payload = {"sub": str(user["id"]), "email": user["email"], "role": user["role"]}
        access_token = create_access_token(user_payload)

        # Generar jti y refresh token
        new_jti = str(uuid.uuid4())
        refresh_token = create_refresh_token(user_payload, jti=new_jti)

        expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        # Guardar en DB
        async with DatabaseConnection.get_connection() as conn:
            await conn.execute(
                """
                INSERT INTO refresh_tokens (jti, user_id, created_at, expires_at, ip, user_agent)
                VALUES ($1, $2, now(), $3, $4, $5)
                """,
                new_jti, user["id"], expires_at, ip, user_agent
            )

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "refresh_jti": new_jti,
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }

    @staticmethod
    async def validate_refresh_token_jti(jti: str) -> Optional[Dict[str, Any]]:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM refresh_tokens WHERE jti = $1",
                jti
            )
            if not row:
                return None
            if row["revoked"]:
                return None
            if row["expires_at"] and row["expires_at"] < datetime.now(timezone.utc):
                return None
            return dict(row)

    @staticmethod
    async def revoke_refresh_token(jti: str, by_user_id: Optional[str] = None) -> None:
        async with DatabaseConnection.get_connection() as conn:
            await conn.execute(
                "UPDATE refresh_tokens SET revoked = true, revoked_at = now() WHERE jti = $1",
                jti
            )

    @staticmethod
    async def revoke_all_user_refresh_tokens(user_id: str) -> None:
        async with DatabaseConnection.get_connection() as conn:
            await conn.execute(
                "UPDATE refresh_tokens SET revoked = true, revoked_at = now() WHERE user_id = $1 AND revoked = false",
                user_id
            )

    @staticmethod
    async def rotate_refresh_token(old_jti: str, user_id: str, ip: Optional[str] = None, user_agent: Optional[str] = None) -> Dict[str, Any]:
        # valida que old_jti existe y no revocado
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow("SELECT * FROM refresh_tokens WHERE jti = $1 AND user_id = $2", old_jti, user_id)
            if not row or row["revoked"] or row["expires_at"] < datetime.now(timezone.utc):
                return None

            # crear nuevo jti + jwt
            new_jti = str(uuid.uuid4())
            # payload para tokens: sub, email, role -> obtener user info
            user_row = await conn.fetchrow("SELECT id, email, role FROM users WHERE id = $1", user_id)
            if not user_row:
                return None
            user_payload = {"sub": str(user_row["id"]), "email": user_row["email"], "role": user_row["role"]}
            new_refresh_jwt = create_refresh_token(user_payload, jti=new_jti)
            new_access_jwt = create_access_token(user_payload)

            expires_at = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

            # insert nuevo refresh
            await conn.execute(
                "INSERT INTO refresh_tokens (jti, user_id, created_at, expires_at, ip, user_agent) VALUES ($1, $2, now(), $3, $4, $5)",
                new_jti, user_id, expires_at, ip, user_agent
            )

            # marcar old como revocado y linkear replaced_by_jti
            await conn.execute(
                "UPDATE refresh_tokens SET revoked = true, revoked_at = now(), replaced_by_jti = $1 WHERE jti = $2",
                new_jti, old_jti
            )

            return {
                "access_token": new_access_jwt,
                "refresh_token": new_refresh_jwt,
                "refresh_jti": new_jti,
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
    @staticmethod
    async def update_password(user_id: str, new_password: str):
        """Actualiza la contraseña de un usuario"""
        pwd_hash = hash_password(new_password)
        async with DatabaseConnection.get_connection() as conn:
            await conn.execute(
                "UPDATE users SET password_hash = $1 WHERE id = $2",
                pwd_hash, user_id
            )

    @staticmethod
    def hash_password(password: str) -> str:
        """Hashea una contraseña (método síncrono)"""
        return hash_password(password)
