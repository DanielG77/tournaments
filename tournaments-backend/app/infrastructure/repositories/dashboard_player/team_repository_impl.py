from typing import List, Optional
from uuid import UUID
from domain.entities.dashboard_player.team import Team, UserTeam
from domain.repositories.dashboard_player.team_repository import TeamRepository
from infrastructure.database.connection import DatabaseConnection

class TeamRepositoryImpl(TeamRepository):

    async def find_by_user_id(self, user_id: UUID) -> List[Team]:
        async with DatabaseConnection.get_connection() as conn:
            rows = await conn.fetch(
                "SELECT teams.*, team_members.user_id FROM team_members INNER JOIN teams ON team_members.team_id = teams.id WHERE team_members.user_id = $1",
                user_id
            )
            return [
                Team(
                    id=row['id'],
                    owner_user_id=row['owner_user_id'],
                    name=row['name'],
                    created_at=row['created_at'],
                    status=row['status'],
                    is_active=row.get('is_active', False)
                )
                for row in rows
            ]

    async def find_by_user(self, user_id: UUID) -> List[UserTeam]:
        async with DatabaseConnection.get_connection() as conn:
            rows = await conn.fetch(
                "SELECT teams.*, team_members.user_id FROM team_members INNER JOIN teams ON team_members.team_id = teams.id WHERE team_members.user_id = $1",
                user_id
            )
            return [
                UserTeam(
                    id=row['id'],
                    name=row['name'],
                    user_id=row['user_id'],
                    owner_user_id=row['owner_user_id'],
                    created_at=row['created_at'],
                    status=row['status'],
                    is_active=row.get('is_active', False)
                )
                for row in rows
            ]

    async def find_by_id(self, team_id: UUID) -> Optional[Team]:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM teams WHERE id = $1",
                team_id
            )
            if row:
                return Team(
                    id=row['id'],
                    owner_user_id=row['owner_user_id'],
                    name=row['name'],
                    created_at=row['created_at'],
                    status=row['status'],
                    is_active=row.get('is_active', False)
                )
            return None

    async def find_public_teams(self) -> List[Team]:
        async with DatabaseConnection.get_connection() as conn:
            rows = await conn.fetch(
                "SELECT * FROM teams WHERE is_public = TRUE"
            )
            return [
                Team(
                    id=row['id'],
                    user_id=row['user_id'],
                    name=row['name'],
                    created_at=row['created_at'],
                    is_public=True
                )
                for row in rows
            ]

    async def save(self, team: Team) -> Team:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO teams (id, user_id, name, created_at, is_public)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
                """,
                team.id, team.user_id, team.name, team.created_at, getattr(team, 'is_public', False)
            )
            return Team(**row)

    async def update(self, team: Team) -> Team:
        async with DatabaseConnection.get_connection() as conn:
            row = await conn.fetchrow(
                """
                UPDATE teams
                SET name = $2, is_public = $4
                WHERE id = $1
                RETURNING *
                """,
                team.id, team.name, getattr(team, 'is_public', False)
            )
            return Team(**row)

    async def delete(self, team_id: UUID) -> None:
        async with DatabaseConnection.get_connection() as conn:
            await conn.execute(
                "DELETE FROM teams WHERE id = $1",
                team_id
            )
