from typing import List, Optional
from uuid import UUID
from infrastructure.database.connection import DatabaseConnection
import asyncpg

class CoachRepositoryImpl:
    pool = DatabaseConnection  # asumes DatabaseConnection.get_pool() inicializado

    @staticmethod
    async def get_coach_profile(user_id: UUID) -> Optional[dict]:
        pool = await DatabaseConnection.get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, email, created_at, avatar_url
                FROM users
                WHERE id = $1
            """, str(user_id))
            return dict(row) if row else None

    @staticmethod
    async def list_teams_by_coach(coach_user_id: UUID) -> List[dict]:
        pool = await DatabaseConnection.get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT t.id, t.name, t.status, t.is_active, t.created_at,
                       (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) AS players_count
                FROM teams t
                WHERE t.coach_user_id = $1
                ORDER BY t.name
            """, str(coach_user_id))
            return [dict(r) for r in rows]

    @staticmethod
    async def get_team_detail(team_id: UUID) -> Optional[dict]:
        pool = await DatabaseConnection.get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, owner_user_id, coach_user_id, status, is_active, created_at
                FROM teams
                WHERE id = $1
            """, str(team_id))
            return dict(row) if row else None

    @staticmethod
    async def list_players_by_team(team_id: UUID) -> List[dict]:
        pool = await DatabaseConnection.get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT u.id as user_id, u.email, pp.nickname,
                       ua.game_key, ua.platform, ua.platform_account_id, ua.display_name
                FROM team_members tm
                JOIN users u ON tm.user_id = u.id
                LEFT JOIN player_profiles pp ON pp.user_id = u.id
                LEFT JOIN user_game_accounts ua ON ua.user_id = u.id
                WHERE tm.team_id = $1
                ORDER BY pp.nickname NULLS LAST, u.email
            """, str(team_id))
            # Agrupamos para devolver jugadores con lista de game_accounts
            players = {}
            for r in rows:
                uid = str(r['user_id'])
                if uid not in players:
                    players[uid] = {
                        "user_id": uid,
                        "email": r['email'],
                        "nickname": r['nickname'],
                        "game_accounts": []
                    }
                if r['game_key']:
                    players[uid]['game_accounts'].append({
                        "game_key": r['game_key'],
                        "platform": r['platform'],
                        "platform_account_id": r['platform_account_id'],
                        "display_name": r['display_name']
                    })
            return list(players.values())

    @staticmethod
    async def list_game_accounts_for_user(user_id: UUID) -> List[dict]:
        pool = await DatabaseConnection.get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, game_key, platform, platform_account_id, display_name, status, is_active
                FROM user_game_accounts
                WHERE user_id = $1
            """, str(user_id))
            return [dict(r) for r in rows]

    @staticmethod
    async def leave_team_as_coach(coach_user_id: UUID, team_id: UUID) -> bool:
        pool = await DatabaseConnection.get_pool()
        async with pool.acquire() as conn:
            result = await conn.execute("""
                UPDATE teams
                SET coach_user_id = NULL
                WHERE id = $1 AND coach_user_id = $2
            """, str(team_id), str(coach_user_id))
            # result ejemplo: 'UPDATE 1' o 'UPDATE 0'
            return result.endswith("1")

    @staticmethod
    async def get_team_history(team_id: UUID) -> List[dict]:
        pool = await DatabaseConnection.get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT tp.id, tp.tournament_id, tp.status, tp.joined_at, tp.finished_at,
                       t.name AS tournament_name
                FROM tournaments_participants tp
                LEFT JOIN tournaments t ON t.id = tp.tournament_id
                WHERE tp.team_id = $1
                ORDER BY tp.joined_at DESC
            """, str(team_id))
            return [dict(r) for r in rows]

    @staticmethod
    async def list_tournaments_for_team(team_id: UUID) -> List[dict]:
        pool = await DatabaseConnection.get_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT t.id, t.name, t.start_at, t.end_at, tp.status AS participation_status
                FROM tournaments_participants tp
                JOIN tournaments t ON t.id = tp.tournament_id
                WHERE tp.team_id = $1
                ORDER BY t.start_at DESC
            """, str(team_id))
            return [dict(r) for r in rows]
