from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class TournamentBase(BaseModel):
    name: str
    start_at: Optional[datetime] = None      # <-- opcional
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    price_client: Optional[float] = None
    price_player: Optional[float] = None



class TournamentCreate(TournamentBase):
    pass

class TournamentUpdate(BaseModel):
    name: Optional[str] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    price_client: Optional[float] = None
    price_player: Optional[float] = None

class TournamentResponse(TournamentBase):
    id: UUID
    created_at: Optional[datetime] = None    # <-- opcional si DB puede tener NULL
    updated_at: Optional[datetime] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)
