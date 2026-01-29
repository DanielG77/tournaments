# tournaments-backend/app/application/schemas/admin/teams.py
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from enum import Enum


class TeamMemberStatus(str, Enum):
    pending = "pending"
    active = "active"
    rejected = "rejected"


class TeamMemberOut(BaseModel):
    id: Optional[UUID] = None
    user_id: UUID
    user_name: Optional[str] = None
    role: str
    status: TeamMemberStatus
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TeamMemberCreate(BaseModel):
    user_id_to_add: UUID
    role: Optional[str] = "member"


class TeamMemberStatusUpdate(BaseModel):
    status: TeamMemberStatus

class TeamAdminListResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime

class TeamOut(BaseModel):
    id: UUID
    name: str
    owner_user_id: Optional[UUID]
    coach_user_id: Optional[UUID]
    members: List[TeamMemberOut] = []
    created_at: datetime
    status: str
    is_active: bool

    class Config:
        from_attributes = True


class TeamUpdateIn(BaseModel):
    name: Optional[str]
    coach_user_id: Optional[UUID]
    is_active: Optional[bool]
