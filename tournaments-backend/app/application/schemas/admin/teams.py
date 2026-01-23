from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime




class TeamOut(BaseModel):
    id: UUID
    name: str
    owner_user_id: Optional[UUID]
    coach_user_id: Optional[UUID]
    created_at: datetime
    status: str
    is_active: bool




class TeamUpdateIn(BaseModel):
    name: Optional[str]
    coach_user_id: Optional[UUID]
    is_active: Optional[bool]