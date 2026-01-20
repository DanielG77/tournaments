from typing import List, Optional
from uuid import UUID
from domain.entities.dashboard_player.game_account import UserGameAccount as GameAccount
from domain.repositories.dashboard_player.game_account_repository import GameAccountRepository
from infrastructure.database.connection import DatabaseConnection

class GameAccountRepositoryImpl(GameAccountRepository):

    async def find_by_user_id(self, user_id: UUID) -> List[GameAccount]:
        async with DatabaseConnection.get_connection() as conn:
            rows = await conn.fetch(
                "SELECT * FROM user_game_accounts WHERE user_id = $1",
                user_id
            )
            return [GameAccount(**row) for row in rows]

    async def find_by_game_and_platform(self, user_id: UUID, game_key: str, platform: str) -> List[GameAccount]:
        async with DatabaseConnection.get_connection() as conn:
            rows = await conn.fetch(
                "SELECT * FROM user_game_accounts WHERE user_id = $1 AND game_key = $2 AND platform = $3",
                user_id, game_key, platform
            )
            return [GameAccount(**row) for row in rows]

    async def find_by_id(self, account_id: UUID) -> Optional[GameAccount]:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM user_game_accounts WHERE id = $1",
                account_id
            )
            if row:
                return GameAccount(**row)
            return None

    async def save(self, account: GameAccount) -> GameAccount:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO user_game_accounts 
                (id, user_id, game_key, platform, platform_account_id, display_name, metadata, status, is_active, created_at)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
                RETURNING *
                """,
                account.id, account.user_id, account.game_key, account.platform,
                account.platform_account_id, account.display_name, account.metadata,
                account.status, account.is_active, account.created_at
            )
            return GameAccount(**row)

    async def update(self, account: GameAccount) -> GameAccount:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                UPDATE user_game_accounts
                SET display_name = $2, metadata = $3, status = $4, is_active = $5
                WHERE id = $1
                RETURNING *
                """,
                account.id, account.display_name, account.metadata,
                account.status, account.is_active
            )
            return GameAccount(**row)

    async def delete(self, account_id: UUID) -> None:
        async with DatabaseConnection.get_connection() as conn:
            await conn.execute(
                "DELETE FROM user_game_accounts WHERE id = $1",
                account_id
            )
