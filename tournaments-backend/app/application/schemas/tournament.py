from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID
from typing import Optional

class TournamentBase(BaseModel):
    name: str
    start_at: datetime
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    price_client: Optional[float] = None  # Para numeric(10,2) - precio público
    price_player: Optional[float] = None  # Para numeric(10,2) - precio para jugadores

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
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)