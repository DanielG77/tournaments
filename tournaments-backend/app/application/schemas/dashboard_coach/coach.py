from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class GameAccount(BaseModel):
    id: UUID
    game_key: str
    platform: Optional[str]
    platform_account_id: str
    display_name: Optional[str]
    status: Optional[str]
    is_active: Optional[bool]

class PlayerBasic(BaseModel):
    user_id: UUID
    email: Optional[str]
    nickname: Optional[str]
    game_accounts: List[GameAccount] = []

class TeamShort(BaseModel):
    id: UUID
    name: str
    status: str
    is_active: bool
    players_count: int

class TeamCreateRequest(BaseModel):
    name: str

class TeamCreateResponse(BaseModel):
    id: UUID
    name: str
    status: str
    is_active: bool
    owner_user_id: Optional[UUID]
    coach_user_id: Optional[UUID]
    created_at: datetime

class TeamDetail(TeamShort):
    owner_user_id: Optional[UUID]
    coach_user_id: Optional[UUID]
    created_at: datetime

class TournamentSummary(BaseModel):
    id: UUID
    name: str
    start_at: Optional[datetime]
    end_at: Optional[datetime]
    participation_status: Optional[str]

class AddPlayerPayload(BaseModel):
    user_id: UUID
    role: Optional[str] = "member"
