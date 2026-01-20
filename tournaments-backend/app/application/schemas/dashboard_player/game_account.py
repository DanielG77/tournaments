from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

class GameAccountBase(BaseModel):
    game_key: str = Field(..., min_length=1)
    platform: Optional[str] = None
    platform_account_id: str = Field(..., min_length=1)
    display_name: Optional[str] = None

class GameAccountCreate(GameAccountBase):
    pass

class GameAccountUpdate(BaseModel):
    display_name: Optional[str] = None
    platform: Optional[str] = None

class GameAccountResponse(GameAccountBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    status: str
    is_active: bool
    
    class Config:
        from_attributes = True