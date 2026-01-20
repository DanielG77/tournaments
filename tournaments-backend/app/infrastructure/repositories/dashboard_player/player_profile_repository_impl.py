from typing import List, Optional
from uuid import UUID
import asyncpg
from domain.entities.dashboard_player.team import Team, PokemonTeamMember
from domain.repositories.dashboard_player.team_repository import TeamRepository, PokemonTeamMemberRepository
from infrastructure.database.connection import DatabaseConnection

class TeamRepositoryImpl(TeamRepository):
    async def find_by_id(self, team_id: UUID) -> Optional[Team]:
        conn = await DatabaseConnection.get_connection()
        row = await conn.fetchrow(
            """
            SELECT * FROM teams WHERE id = $1
            """,
            team_id
        )
        if row:
            return Team(
                id=row['id'],
                name=row['name'],
                user_id=row['user_id'],
                game_key=row['game_key'],
                description=row.get('description'),
                is_public=row['is_public'],
                created_at=row['created_at'],
                metadata=row['metadata'],
                status=row['status'],
                is_active=row['is_active']
            )
        return None
    
    async def find_by_user_id(self, user_id: UUID) -> List[Team]:
        conn = await DatabaseConnection.get_connection()
        rows = await conn.fetch(
            """
            SELECT * FROM teams 
            WHERE user_id = $1 AND status = 'active'
            ORDER BY created_at DESC
            """,
            user_id
        )
        return [
            Team(
                id=row['id'],
                name=row['name'],
                user_id=row['user_id'],
                game_key=row['game_key'],
                description=row.get('description'),
                is_public=row['is_public'],
                created_at=row['created_at'],
                metadata=row['metadata'],
                status=row['status'],
                is_active=row['is_active']
            )
            for row in rows
        ]
    
    async def save(self, team: Team) -> Team:
        conn = await DatabaseConnection.get_connection()
        row = await conn.fetchrow(
            """
            INSERT INTO teams (id, name, user_id, game_key, description, is_public,
                             created_at, metadata, status, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
            """,
            team.id, team.name, team.user_id, team.game_key, team.description,
            team.is_public, team.created_at, team.metadata, team.status, team.is_active
        )
        return Team(**row)
    
    async def update(self, team: Team) -> Team:
        conn = await DatabaseConnection.get_connection()
        row = await conn.fetchrow(
            """
            UPDATE teams 
            SET name = $2, description = $3, is_public = $4,
                metadata = $5, status = $6, is_active = $7
            WHERE id = $1
            RETURNING *
            """,
            team.id, team.name, team.description, team.is_public,
            team.metadata, team.status, team.is_active
        )
        return Team(**row)
    
    async def delete(self, team_id: UUID) -> bool:
        conn = await DatabaseConnection.get_connection()
        result = await conn.execute(
            """
            UPDATE teams 
            SET status = 'deleted', is_active = false
            WHERE id = $1
            """,
            team_id
        )
        return "UPDATE 1" in result

class PokemonTeamMemberRepositoryImpl(PokemonTeamMemberRepository):
    async def find_by_team_id(self, team_id: UUID) -> List[PokemonTeamMember]:
        conn = await DatabaseConnection.get_connection()
        rows = await conn.fetch(
            """
            SELECT * FROM team_members 
            WHERE team_id = $1
            ORDER BY position
            """,
            team_id
        )
        return [
            PokemonTeamMember(
                id=row['id'],
                team_id=row['team_id'],
                pokemon_id=row['pokemon_id'],
                nickname=row.get('nickname'),
                level=row['level'],
                ability=row.get('ability'),
                item=row.get('item'),
                moves=row['moves'],
                ivs=row['ivs'],
                evs=row['evs'],
                nature=row.get('nature'),
                tera_type=row.get('tera_type'),
                position=row['position'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
            for row in rows
        ]
    
    async def save(self, member: PokemonTeamMember) -> PokemonTeamMember:
        conn = await DatabaseConnection.get_connection()
        row = await conn.fetchrow(
            """
            INSERT INTO team_members (id, team_id, pokemon_id, nickname, level,
                                    ability, item, moves, ivs, evs, nature,
                                    tera_type, position, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
            """,
            member.id, member.team_id, member.pokemon_id, member.nickname,
            member.level, member.ability, member.item, member.moves,
            member.ivs, member.evs, member.nature, member.tera_type,
            member.position, member.created_at, member.updated_at
        )
        return PokemonTeamMember(**row)
    
    async def delete_by_team_id(self, team_id: UUID) -> None:
        conn = await DatabaseConnection.get_connection()
        await conn.execute(
            """
            DELETE FROM team_members WHERE team_id = $1
            """,
            team_id
        )