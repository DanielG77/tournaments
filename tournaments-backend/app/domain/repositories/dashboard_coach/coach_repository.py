from typing import List, Optional
from uuid import UUID

from ..dashboard_player.team_repository import Team as team_entity
from ..dashboard_player.user_repository import User as user_entity
from ..tournament_repository import Tournament as tournament_entity


class CoachRepository:
    async def get_coach_profile(self, user_id: UUID) -> Optional[user_entity]:
        raise NotImplementedError

    async def list_teams_by_coach(self, coach_user_id: UUID) -> List[team_entity]:
        raise NotImplementedError

    async def get_team_detail(self, team_id: UUID) -> Optional[team_entity]:
        raise NotImplementedError

    async def list_players_by_team(self, team_id: UUID) -> List[user_entity]:
        raise NotImplementedError

    async def list_game_accounts_for_user(self, user_id: UUID) -> List[dict]:
        raise NotImplementedError

    async def leave_team_as_coach(self, coach_user_id: UUID, team_id: UUID) -> bool:
        raise NotImplementedError

    async def get_team_history(self, team_id: UUID) -> List[dict]:
        raise NotImplementedError

    async def list_tournaments_for_team(self, team_id: UUID) -> List[tournament_entity]:
        raise NotImplementedError
