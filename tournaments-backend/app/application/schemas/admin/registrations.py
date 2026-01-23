from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime




class RegistrationOut(BaseModel):
    id: UUID
    tournament_id: UUID
    team_id: UUID
    status: str
    applied_at: datetime
    reviewed_at: Optional[datetime]
    reviewed_by: Optional[UUID]
    rejection_reason: Optional[str]
    game_specific_data: Optional[dict]




class RegistrationReviewIn(BaseModel):
    status: str
    rejection_reason: Optional[str] = None