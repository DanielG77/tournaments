from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID
from domain.entities.dashboard_player.team import Team, PokemonTeamMember

class TeamRepository(ABC):
    @abstractmethod
    async def find_by_id(self, team_id: UUID) -> Optional[Team]:
        pass
    
    @abstractmethod
    async def find_by_user_id(self, user_id: UUID) -> List[Team]:
        pass
    
    @abstractmethod
    async def find_public_teams(self, game_key: str, limit: int, offset: int) -> List[Team]:
        pass
    
    @abstractmethod
    async def save(self, team: Team) -> Team:
        pass
    
    @abstractmethod
    async def update(self, team: Team) -> Team:
        pass
    
    @abstractmethod
    async def delete(self, team_id: UUID) -> bool:
        pass

class PokemonTeamMemberRepository(ABC):
    @abstractmethod
    async def find_by_team_id(self, team_id: UUID) -> List[PokemonTeamMember]:
        pass
    
    @abstractmethod
    async def find_by_pokemon_id_in_team(self, team_id: UUID, pokemon_id: int) -> Optional[PokemonTeamMember]:
        pass
    
    @abstractmethod
    async def find_by_position(self, team_id: UUID, position: int) -> Optional[PokemonTeamMember]:
        pass
    
    @abstractmethod
    async def save(self, member: PokemonTeamMember) -> PokemonTeamMember:
        pass
    
    @abstractmethod
    async def update(self, member: PokemonTeamMember) -> PokemonTeamMember:
        pass
    
    @abstractmethod
    async def delete(self, member_id: UUID) -> bool:
        pass
    
    @abstractmethod
    async def delete_by_team_id(self, team_id: UUID) -> None:
        pass
    
    @abstractmethod
    async def count_by_team_id(self, team_id: UUID) -> int:
        pass
    
    @abstractmethod
    async def get_positions_occupied(self, team_id: UUID) -> List[int]:
        pass