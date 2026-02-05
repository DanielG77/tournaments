from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, date
from typing import Optional
from uuid import UUID

class PlayerProfileBase(BaseModel):
    nickname: Optional[str] = Field(None, max_length=100)

class PlayerProfileCreate(PlayerProfileBase):
    pass
class PlayerProfileUpdate(PlayerProfileBase):
    password: Optional[str] = None

class PlayerProfileResponse(PlayerProfileBase):
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: UUID
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    date_born: Optional[date]
    avatar_url: Optional[str]
    
    class Config:
        from_attributes = True

class PlayerDashboardResponse(BaseModel):
    user: UserResponse
    profile: Optional[PlayerProfileResponse]
    teams_count: int
    tournaments_count: int
    game_accounts_count: int