from typing import List, Optional
from uuid import UUID
import asyncpg
from domain.entities.dashboard_player.team import PokemonTeamMember as PokemonTeamMemberEntity
from domain.repositories.dashboard_player.team_repository import PokemonTeamMemberRepository
from infrastructure.database.connection import DatabaseConnection

class PokemonTeamMemberRepositoryImpl(PokemonTeamMemberRepository):
    async def find_by_team_id(self, team_id: UUID) -> List[PokemonTeamMemberEntity]:
        """Get all Pokémon members for a specific team"""
        conn = await DatabaseConnection.get_connection()
        rows = await conn.fetch(
            """
            SELECT * FROM team_members 
            WHERE team_id = $1
            ORDER BY position ASC
            """,
            team_id
        )
        
        members = []
        for row in rows:
            members.append(PokemonTeamMemberEntity(
                id=row['id'],
                team_id=row['team_id'],
                pokemon_id=row['pokemon_id'],
                nickname=row.get('nickname'),
                level=row['level'],
                ability=row.get('ability'),
                item=row.get('item'),
                moves=row['moves'] if row['moves'] else [],
                ivs=row['ivs'] if row['ivs'] else {},
                evs=row['evs'] if row['evs'] else {},
                nature=row.get('nature'),
                tera_type=row.get('tera_type'),
                position=row['position'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            ))
        return members
    
    async def find_by_pokemon_id_in_team(self, team_id: UUID, pokemon_id: int) -> Optional[PokemonTeamMemberEntity]:
        """Find a specific Pokémon in a team by Pokémon ID"""
        conn = await DatabaseConnection.get_connection()
        row = await conn.fetchrow(
            """
            SELECT * FROM team_members 
            WHERE team_id = $1 AND pokemon_id = $2
            """,
            team_id, pokemon_id
        )
        
        if row:
            return PokemonTeamMemberEntity(
                id=row['id'],
                team_id=row['team_id'],
                pokemon_id=row['pokemon_id'],
                nickname=row.get('nickname'),
                level=row['level'],
                ability=row.get('ability'),
                item=row.get('item'),
                moves=row['moves'] if row['moves'] else [],
                ivs=row['ivs'] if row['ivs'] else {},
                evs=row['evs'] if row['evs'] else {},
                nature=row.get('nature'),
                tera_type=row.get('tera_type'),
                position=row['position'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
        return None
    
    async def find_by_position(self, team_id: UUID, position: int) -> Optional[PokemonTeamMemberEntity]:
        """Find a Pokémon in a team by position"""
        conn = await DatabaseConnection.get_connection()
        row = await conn.fetchrow(
            """
            SELECT * FROM team_members 
            WHERE team_id = $1 AND position = $2
            """,
            team_id, position
        )
        
        if row:
            return PokemonTeamMemberEntity(
                id=row['id'],
                team_id=row['team_id'],
                pokemon_id=row['pokemon_id'],
                nickname=row.get('nickname'),
                level=row['level'],
                ability=row.get('ability'),
                item=row.get('item'),
                moves=row['moves'] if row['moves'] else [],
                ivs=row['ivs'] if row['ivs'] else {},
                evs=row['evs'] if row['evs'] else {},
                nature=row.get('nature'),
                tera_type=row.get('tera_type'),
                position=row['position'],
                created_at=row['created_at'],
                updated_at=row['updated_at']
            )
        return None
    
    async def save(self, member: PokemonTeamMemberEntity) -> PokemonTeamMemberEntity:
        """Save a new Pokémon team member"""
        conn = await DatabaseConnection.get_connection()
        
        row = await conn.fetchrow(
            """
            INSERT INTO team_members 
            (id, team_id, pokemon_id, nickname, level, ability, item, 
             moves, ivs, evs, nature, tera_type, position, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
            """,
            member.id, member.team_id, member.pokemon_id, member.nickname,
            member.level, member.ability, member.item, member.moves,
            member.ivs, member.evs, member.nature, member.tera_type,
            member.position, member.created_at, member.updated_at
        )
        
        return PokemonTeamMemberEntity(
            id=row['id'],
            team_id=row['team_id'],
            pokemon_id=row['pokemon_id'],
            nickname=row.get('nickname'),
            level=row['level'],
            ability=row.get('ability'),
            item=row.get('item'),
            moves=row['moves'] if row['moves'] else [],
            ivs=row['ivs'] if row['ivs'] else {},
            evs=row['evs'] if row['evs'] else {},
            nature=row.get('nature'),
            tera_type=row.get('tera_type'),
            position=row['position'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    async def update(self, member: PokemonTeamMemberEntity) -> PokemonTeamMemberEntity:
        """Update an existing Pokémon team member"""
        conn = await DatabaseConnection.get_connection()
        
        row = await conn.fetchrow(
            """
            UPDATE team_members 
            SET nickname = $2, level = $3, ability = $4, item = $5,
                moves = $6, ivs = $7, evs = $8, nature = $9,
                tera_type = $10, position = $11, updated_at = $12
            WHERE id = $1
            RETURNING *
            """,
            member.id, member.nickname, member.level, member.ability,
            member.item, member.moves, member.ivs, member.evs,
            member.nature, member.tera_type, member.position,
            member.updated_at
        )
        
        return PokemonTeamMemberEntity(
            id=row['id'],
            team_id=row['team_id'],
            pokemon_id=row['pokemon_id'],
            nickname=row.get('nickname'),
            level=row['level'],
            ability=row.get('ability'),
            item=row.get('item'),
            moves=row['moves'] if row['moves'] else [],
            ivs=row['ivs'] if row['ivs'] else {},
            evs=row['evs'] if row['evs'] else {},
            nature=row.get('nature'),
            tera_type=row.get('tera_type'),
            position=row['position'],
            created_at=row['created_at'],
            updated_at=row['updated_at']
        )
    
    async def delete(self, member_id: UUID) -> bool:
        """Delete a Pokémon team member by ID"""
        conn = await DatabaseConnection.get_connection()
        result = await conn.execute(
            """
            DELETE FROM team_members WHERE id = $1
            """,
            member_id
        )
        return "DELETE 1" in result
    
    async def delete_by_team_id(self, team_id: UUID) -> None:
        """Delete all Pokémon members for a team"""
        conn = await DatabaseConnection.get_connection()
        await conn.execute(
            """
            DELETE FROM team_members WHERE team_id = $1
            """,
            team_id
        )
    
    async def count_by_team_id(self, team_id: UUID) -> int:
        """Count how many Pokémon are in a team"""
        conn = await DatabaseConnection.get_connection()
        row = await conn.fetchrow(
            """
            SELECT COUNT(*) as count FROM team_members WHERE team_id = $1
            """,
            team_id
        )
        return row['count'] if row else 0
    
    async def get_positions_occupied(self, team_id: UUID) -> List[int]:
        """Get all occupied positions in a team"""
        conn = await DatabaseConnection.get_connection()
        rows = await conn.fetch(
            """
            SELECT position FROM team_members WHERE team_id = $1
            """,
            team_id
        )
        return [row['position'] for row in rows]