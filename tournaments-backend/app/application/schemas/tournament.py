from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class TournamentBase(BaseModel):
    name: str
    start_date: datetime
    end_date: Optional[datetime] = None
    location: Optional[str] = None

class TournamentCreate(TournamentBase):
    pass

class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None

class TournamentResponse(TournamentBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)