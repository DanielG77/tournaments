from uuid import UUID
from typing import List, Optional
from domain.repositories.dashboard_coach.coach_repository import CoachRepository

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
