from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime




class TournamentBase(BaseModel):
    name: str
    description: Optional[str] = None
    images: Optional[List] = Field(default_factory=list)
    status: Optional[str] = "draft"
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    price_client: Optional[float] = 0.0
    price_player: Optional[float] = 0.0
    is_active: Optional[bool] = True




class TournamentCreate(TournamentBase):
    pass




class TournamentUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    images: Optional[List]
    status: Optional[str]
    start_at: Optional[datetime]
    end_at: Optional[datetime]
    price_client: Optional[float]
    price_player: Optional[float]
    is_active: Optional[bool]




class TournamentOut(TournamentBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # si usas ORM
