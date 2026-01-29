from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime
from domain.repositories.dashboard_player.team_repository import TeamRepository, PokemonTeamMemberRepository
from domain.repositories.dashboard_player.pokemon_repository import PokemonAPIRepository
from application.schemas.dashboard_player.team import (
    TeamCreate, TeamResponse, TeamUpdate, 
    TeamWithPokemonResponse, PokemonTeamMember
)
from application.schemas.dashboard_player.pokemon import PokemonResponse
from domain.entities.dashboard_player.team import Team, PokemonTeamMember as PokemonTeamMemberEntity

from core.exceptions import (
    NotFoundError,
    ForbiddenError,
    ValidationError
)
from infrastructure.external.pokeapi_client import (
    PokeAPIClient,
    PokeAPINotFound
)
from infrastructure.repositories.dashboard_player.pokemon_team_repository_impl import (
    PokemonTeamRepositoryImpl
)
from infrastructure.repositories.dashboard_player.pokemon_team_member_repository_impl import (
    PokemonTeamMemberRepositoryImpl
)

class TeamService:
    def __init__(
        self,
        team_repo: TeamRepository,
        pokemon_member_repo: PokemonTeamMemberRepository,
        pokeapi_client: PokemonAPIRepository
    ):
        self.team_repo = team_repo
        self.pokemon_member_repo = pokemon_member_repo
        self.pokeapi_client = pokeapi_client
    
    async def get_user_teams(
        self, 
        user_id: UUID, 
        game_key: Optional[str] = None,
        is_public: Optional[bool] = None
    ) -> List[TeamResponse]:
        teams = await self.team_repo.find_by_user_id(user_id)
        
        # Aplicar filtros
        if game_key:
            teams = [t for t in teams if t.game_key == game_key]
        if is_public is not None:
            teams = [t for t in teams if t.is_public == is_public]
        
        return [
            TeamResponse(
                id=team.id,
                name=team.name,
                owner_user_id=team.owner_user_id,
                created_at=team.created_at,
                status=team.status,
                is_active=team.is_active
            )
            for team in teams
        ]
    
    async def create_team(self, user_id: UUID, team_data: TeamCreate) -> TeamResponse:
        team_id = uuid4()
        now = datetime.now()
        
        team = Team(
            id=team_id,
            name=team_data.name,
            owner_user_id=user_id,
            created_at=now,
            status='active',
            is_active=True
        )
        
        saved_team = await self.team_repo.save(team)
        
        return TeamResponse(
            id=saved_team.id,
            name=saved_team.name,
            owner_user_id=saved_team.owner_user_id,
            created_at=saved_team.created_at,
            status=saved_team.status,
            is_active=saved_team.is_active
        )
    
    async def get_team_with_pokemon(self, user_id: UUID, team_id: UUID) -> Optional[TeamWithPokemonResponse]:
        team = await self.team_repo.find_by_id(team_id)
        if not team or team.user_id != user_id:
            return None
        
        pokemon_members = await self.pokemon_member_repo.find_by_team_id(team_id)
        
        return TeamWithPokemonResponse(
            id=team.id,
            name=team.name,
            user_id=team.owner_user_id,
            created_at=team.created_at,
            status=team.status,
            is_active=team.is_active,
            pokemon_members=[
                PokemonTeamMember(
                    pokemon_id=member.pokemon_id,
                    nickname=member.nickname,
                    level=member.level,
                    ability=member.ability,
                    item=member.item,
                    moves=member.moves,
                    ivs=member.ivs,
                    evs=member.evs,
                    nature=member.nature,
                    tera_type=member.tera_type,
                    position=member.position
                )
                for member in pokemon_members
            ]
        )
    
    async def update_team(self, user_id: UUID, team_id: UUID, team_update: TeamUpdate) -> TeamResponse:
        team = await self.team_repo.find_by_id(team_id)
        if not team or team.user_id != user_id:
            raise ValueError("Team not found or you don't have permission")
        
        # Actualizar solo los campos proporcionados
        if team_update.name is not None:
            team.name = team_update.name
        
        updated_team = await self.team_repo.update(team)
        
        return TeamResponse(
            id=updated_team.id,
            name=updated_team.name,
            owner_user_id=updated_team.owner_user_id,
            created_at=updated_team.created_at,
            status=updated_team.status,
            is_active=updated_team.is_active
        )
    
    async def delete_team(self, user_id: UUID, team_id: UUID) -> bool:
        team = await self.team_repo.find_by_id(team_id)
        if not team or team.owner_user_id != user_id:
            return False
        
        # Primero eliminar los Pokémon del equipo
        await self.pokemon_member_repo.delete_by_team_id(team_id)
        
        # Luego eliminar el equipo (soft delete)
        return await self.team_repo.delete(team_id)
    
    async def add_pokemon_to_team(
        self, 
        user_id: UUID, 
        team_id: UUID, 
        pokemon_data: PokemonTeamMember
    ) -> TeamWithPokemonResponse:
        # Verificar que el equipo exista y pertenezca al usuario
        team = await self.team_repo.find_by_id(team_id)
        if not team or team.user_id != user_id:
            raise ValueError("Team not found or you don't have permission")
        
        # Verificar que no haya otro Pokémon en la misma posición
        existing_members = await self.pokemon_member_repo.find_by_team_id(team_id)
        if any(m.position == pokemon_data.position for m in existing_members):
            raise ValueError(f"Position {pokemon_data.position} already occupied")
        
        # Verificar que no exceda el límite de Pokémon
        if len(existing_members) >= 6:
            raise ValueError("Team already has 6 Pokémon")
        
        # Crear el miembro del equipo
        member_id = uuid4()
        now = datetime.now()
        
        member = PokemonTeamMemberEntity(
            id=member_id,
            team_id=team_id,
            pokemon_id=pokemon_data.pokemon_id,
            nickname=pokemon_data.nickname,
            level=pokemon_data.level,
            ability=pokemon_data.ability,
            item=pokemon_data.item,
            moves=pokemon_data.moves,
            ivs=pokemon_data.ivs,
            evs=pokemon_data.evs,
            nature=pokemon_data.nature,
            tera_type=pokemon_data.tera_type,
            position=pokemon_data.position,
            created_at=now,
            updated_at=now
        )
        
        await self.pokemon_member_repo.save(member)
        
        # Devolver el equipo actualizado
        return await self.get_team_with_pokemon(user_id, team_id)
    
    async def update_pokemon_in_team(
        self, 
        user_id: UUID, 
        team_id: UUID, 
        pokemon_id: int,
        pokemon_data: PokemonTeamMember
    ) -> TeamWithPokemonResponse:
        # Verificar que el equipo exista y pertenezca al usuario
        team = await self.team_repo.find_by_id(team_id)
        if not team or team.user_id != user_id:
            raise ValueError("Team not found or you don't have permission")
        
        # Buscar el Pokémon en el equipo
        existing_members = await self.pokemon_member_repo.find_by_team_id(team_id)
        member_to_update = None
        
        for member in existing_members:
            if member.pokemon_id == pokemon_id:
                member_to_update = member
                break
        
        if not member_to_update:
            raise ValueError(f"Pokemon with ID {pokemon_id} not found in team")
        
        # Actualizar los campos
        member_to_update.nickname = pokemon_data.nickname
        member_to_update.level = pokemon_data.level
        member_to_update.ability = pokemon_data.ability
        member_to_update.item = pokemon_data.item
        member_to_update.moves = pokemon_data.moves
        member_to_update.ivs = pokemon_data.ivs
        member_to_update.evs = pokemon_data.evs
        member_to_update.nature = pokemon_data.nature
        member_to_update.tera_type = pokemon_data.tera_type
        member_to_update.position = pokemon_data.position
        
        await self.pokemon_member_repo.update(member_to_update)
        
        # Devolver el equipo actualizado
        return await self.get_team_with_pokemon(user_id, team_id)
    
    async def remove_pokemon_from_team(
        self, 
        user_id: UUID, 
        team_id: UUID, 
        position: int
    ) -> TeamWithPokemonResponse:
        # Verificar que el equipo exista y pertenezca al usuario
        team = await self.team_repo.find_by_id(team_id)
        if not team or team.user_id != user_id:
            raise ValueError("Team not found or you don't have permission")
        
        # Buscar el Pokémon en la posición especificada
        existing_members = await self.pokemon_member_repo.find_by_team_id(team_id)
        member_to_remove = None
        
        for member in existing_members:
            if member.position == position:
                member_to_remove = member
                break
        
        if not member_to_remove:
            raise ValueError(f"No Pokémon found in position {position}")
        
        # Eliminar el Pokémon
        await self.pokemon_member_repo.delete(member_to_remove.id)
        
        # Devolver el equipo actualizado
        return await self.get_team_with_pokemon(user_id, team_id)
    
    async def get_public_teams(
        self, 
        game_key: str = "pokemon", 
        limit: int = 20, 
        offset: int = 0
    ) -> List[TeamResponse]:
        # Este método necesitaría una nueva consulta en el repositorio
        # Por ahora, lo dejamos como placeholder
        teams = await self.team_repo.find_public_teams(game_key, limit, offset)
        
        return [
            TeamResponse(
                id=team.id,
                name=team.name,
                owner_user_id=team.owner_user_id,
                created_at=team.created_at,
                status=team.status,
                is_active=team.is_active
            )
            for team in teams
        ]
    
    async def get_pokemon_details_for_team(
        self, 
        user_id: UUID, 
        team_id: UUID, 
        pokemon_id: int
    ) -> Optional[PokemonResponse]:
        # Verificar que el equipo exista y pertenezca al usuario
        team = await self.team_repo.find_by_id(team_id)
        if not team or team.user_id != user_id:
            return None
        
        # Buscar el Pokémon en el equipo
        existing_members = await self.pokemon_member_repo.find_by_team_id(team_id)
        is_in_team = any(member.pokemon_id == pokemon_id for member in existing_members)
        
        if not is_in_team:
            return None
        
        # Obtener detalles de la PokeAPI
        try:
            pokemon_data = await self.pokeapi_client.get_pokemon(str(pokemon_id))
            
            # Transformar los datos para nuestro schema
            pokemon_data['types'] = [
                {"slot": t['slot'], "type": {"name": t['type']['name']}} 
                for t in pokemon_data['types']
            ]
            
            pokemon_data['stats'] = [
                {
                    "base_stat": s['base_stat'],
                    "effort": s['effort'],
                    "stat": {"name": s['stat']['name']}
                }
                for s in pokemon_data['stats']
            ]
            
            return PokemonResponse(**pokemon_data)
        except Exception:
            return None

# src/application/services/dashboard_player/team_service.py
MAX_MOVES = 4
MAX_EV_TOTAL = 510
MAX_EV_STAT = 252


class PokemonTeamService:

    def __init__(self):
        self.team_repo = PokemonTeamRepositoryImpl()
        self.member_repo = PokemonTeamMemberRepositoryImpl()
        self.pokeapi = PokeAPIClient()

    # ---------- Teams ----------

    async def list_my_teams(self, user_id: UUID):
        return await self.team_repo.list_teams_by_owner(user_id)

    async def create_team(self, user_id: UUID, name: str, is_public: bool):
        return await self.team_repo.create_team(user_id, name, is_public)

    async def delete_team(self, user_id: UUID, team_id: UUID):
        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise NotFoundError("Pokémon team not found")

        if team["owner_user_id"] != user_id:
            raise ForbiddenError("You do not own this team")

        await self.team_repo.delete_team(team_id)

    # ---------- Members ----------

    async def add_member(
        self,
        user_id: UUID,
        team_id: UUID,
        payload: dict
    ):
        team = await self.team_repo.get_team_by_id(team_id)
        if not team:
            raise NotFoundError("Pokémon team not found")

        if team["owner_user_id"] != user_id:
            raise ForbiddenError("You do not own this team")

        # ---- Validate Pokémon exists ----
        try:
            pokemon_data = await self.pokeapi.get_pokemon(payload["pokemon_id"])
            species_data = await self.pokeapi.get_pokemon_species(
                pokemon_data["species"]["name"]
            )
        except PokeAPINotFound:
            raise ValidationError("Invalid Pokémon ID")

        payload["species_id"] = species_data["id"]

        # ---- Validate moves ----
        moves = payload.get("moves", [])
        if len(moves) > MAX_MOVES:
            raise ValidationError("A Pokémon can only have 4 moves")

        # ---- Validate EVs ----
        evs = payload.get("evs", {})
        total_evs = sum(evs.values())
        if total_evs > MAX_EV_TOTAL:
            raise ValidationError("Total EVs cannot exceed 510")

        for stat, value in evs.items():
            if value > MAX_EV_STAT:
                raise ValidationError(f"EV {stat} exceeds max value (252)")

        # ---- Persist ----
        return await self.member_repo.add_member(team_id, payload)

    async def update_member(
        self,
        user_id: UUID,
        member_id: int,
        payload: dict
    ):
        member = await self.member_repo.get_member(member_id)
        if not member:
            raise NotFoundError("Pokémon team member not found")

        team = await self.team_repo.get_team_by_id(member["pokemon_team_id"])
        if team["owner_user_id"] != user_id:
            raise ForbiddenError("You do not own this team")

        if "moves" in payload and len(payload["moves"]) > MAX_MOVES:
            raise ValidationError("A Pokémon can only have 4 moves")

        if "evs" in payload:
            total = sum(payload["evs"].values())
            if total > MAX_EV_TOTAL:
                raise ValidationError("Total EVs cannot exceed 510")

        await self.member_repo.update_member(member_id, payload)

    async def delete_member(self, user_id: UUID, member_id: int):
        member = await self.member_repo.get_member(member_id)
        if not member:
            raise NotFoundError("Pokémon team member not found")

        team = await self.team_repo.get_team_by_id(member["pokemon_team_id"])
        if team["owner_user_id"] != user_id:
            raise ForbiddenError("You do not own this team")

        await self.member_repo.delete_member(member_id)
