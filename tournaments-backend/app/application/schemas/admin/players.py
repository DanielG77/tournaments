from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

class PlayerProfileBase(BaseModel):
    nickname: Optional[str] = Field(None, max_length=100)

class PlayerOut(BaseModel):
    id: UUID
    email: str
    nickname: Optional[str]
    created_at: datetime

class PlayerProfileUpdate(PlayerProfileBase):
    password: Optional[str] = None

class PlayerProfileResponse(PlayerProfileBase):
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
