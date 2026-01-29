from uuid import UUID
from typing import List, Optional

from domain.repositories.dashboard_coach.coach_repository import CoachRepository
from application.schemas.dashboard_coach.coach import TeamCreateRequest, TeamCreateResponse, PlayerBasic
from infrastructure.repositories.dashboard_coach.coach_repository_impl import CoachRepositoryImpl

class CoachService:
    def __init__(self, repo: CoachRepository):
        self.repo = repo

    async def get_profile(self, coach_user_id: UUID) -> Optional[dict]:
        return await self.repo.get_coach_profile(coach_user_id)

    async def get_my_teams(self, coach_user_id: UUID) -> List[dict]:
        return await self.repo.list_teams_by_coach(coach_user_id)

    async def get_team(self, team_id: UUID) -> Optional[dict]:
        return await self.repo.get_team_detail(team_id)

    async def get_players_of_team(self, team_id: UUID) -> List[dict]:
        return await self.repo.list_players_by_team(team_id)

    async def get_game_accounts(self, user_id: UUID) -> List[dict]:
        return await self.repo.list_game_accounts_for_user(user_id)

    async def leave_team(self, coach_user_id: UUID, team_id: UUID) -> bool:
        return await self.repo.leave_team_as_coach(coach_user_id, team_id)

    async def get_team_history(self, team_id: UUID) -> List[dict]:
        return await self.repo.get_team_history(team_id)

    async def get_tournaments_for_team(self, team_id: UUID) -> List[dict]:
        return await self.repo.list_tournaments_for_team(team_id)


    async def create_team(self, coach_user_id: UUID, payload: TeamCreateRequest) -> dict:
        """
        Crea un equipo con owner_user_id = coach_user_id y coach_user_id = coach_user_id.
        Devuelve el registro del equipo creado (dict compatible con TeamDetail).
        """
        team = await self.repo.create_team(name=payload.name, owner_user_id=coach_user_id, coach_user_id=coach_user_id)
        return team

    async def search_users(self, limit: int = 20, offset: int = 0) -> List[dict]:
        """
        Obtiene listado completo de jugadores con perfil (INNER JOIN).
        Devuelve lista con game_accounts incluidas.
        """
        users = await self.repo.search_users(limit=limit, offset=offset)
        return users

    async def add_player_to_team(self, coach_user_id: UUID, team_id: UUID, user_id: UUID, role: str = "member") -> bool:
        """
        Añade un jugador al equipo si el coach_user_id es el coach del equipo.
        """
        # Verificar que coach_user_id es coach del team
        is_coach = await self.repo.is_team_coach(team_id, coach_user_id)
        if not is_coach:
            return False
        # Intentar añadir miembro
        added = await self.repo.add_team_member(team_id, user_id, role)
        return added

