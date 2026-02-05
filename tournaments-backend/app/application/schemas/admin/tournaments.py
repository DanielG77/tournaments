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
    name: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List] = None
    status: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    price_client: Optional[float] = None
    price_player: Optional[float] = None
    is_active: Optional[bool] = None




class TournamentOut(TournamentBase):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # si usas ORM
