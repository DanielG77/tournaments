from typing import Optional
from uuid import UUID
from domain.entities.dashboard_player.user import User, PlayerProfile
from domain.repositories.dashboard_player.user_repository import UserRepository, PlayerProfileRepository
from infrastructure.database.connection import DatabaseConnection

class UserRepositoryImpl(UserRepository):
    async def find_by_id(self, user_id: UUID) -> Optional[User]:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                SELECT * FROM users WHERE id = $1
                """,
                user_id
            )
            if row:
                return User(
                    id=row['id'],
                    email=row['email'],
                    password_hash=row['password_hash'],
                    status=row['status'],
                    is_active=row['is_active'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at'],
                    last_login=row.get('last_login'),
                    date_born=row.get('date_born'),
                    avatar_url=row.get('avatar_url')
                )
            return None

    async def find_by_email(self, email: str) -> Optional[User]:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                SELECT * FROM users WHERE email = $1
                """,
                email
            )
            if row:
                return User(
                    id=row['id'],
                    email=row['email'],
                    password_hash=row['password_hash'],
                    status=row['status'],
                    is_active=row['is_active'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at'],
                    last_login=row.get('last_login'),
                    date_born=row.get('date_born'),
                    avatar_url=row.get('avatar_url')
                )
            return None

    async def save(self, user: User) -> User:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO users (id, email, password_hash, status, is_active, 
                                 created_at, updated_at, last_login, date_born, avatar_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *
                """,
                user.id, user.email, user.password_hash, user.status, user.is_active,
                user.created_at, user.updated_at, user.last_login, user.date_born, user.avatar_url
            )
            return User(**row)

    async def update_last_login(self, user_id: UUID) -> None:
        async with DatabaseConnection.get_connection() as conn:
            await conn.execute(
                """
                UPDATE users 
                SET last_login = NOW(), updated_at = NOW()
                WHERE id = $1
                """,
                user_id
            )

class PlayerProfileRepositoryImpl(PlayerProfileRepository):
    async def find_by_user_id(self, user_id: UUID) -> Optional[PlayerProfile]:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                SELECT * FROM player_profiles WHERE user_id = $1
                """,
                user_id
            )
            if row:
                return PlayerProfile(
                    user_id=row['user_id'],
                    nickname=row['nickname'],
                    created_at=row['created_at'],
                    updated_at=row['updated_at']
                )
            return None

    async def save(self, profile: PlayerProfile) -> PlayerProfile:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO player_profiles (user_id, nickname, created_at, updated_at)
                VALUES ($1, $2, $3, $4)
                RETURNING *
                """,
                profile.user_id, profile.nickname, profile.created_at, profile.updated_at
            )
            return PlayerProfile(**row)

    async def update(self, profile: PlayerProfile) -> PlayerProfile:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                UPDATE player_profiles 
                SET nickname = $2, updated_at = $3
                WHERE user_id = $1
                RETURNING *
                """,
                profile.user_id, profile.nickname, profile.updated_at
            )
            return PlayerProfile(**row)
