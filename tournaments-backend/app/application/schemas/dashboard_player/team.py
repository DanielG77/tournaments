from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

class TeamBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    game_key: str = Field(default="pokemon")
    is_public: bool = False

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    is_public: Optional[bool] = None

class TeamResponse(TeamBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    status: str
    is_active: bool
    
    class Config:
        from_attributes = True

class PokemonTeamMember(BaseModel):
    pokemon_id: int = Field(..., gt=0)
    nickname: Optional[str] = Field(None, max_length=50)
    level: int = Field(default=50, ge=1, le=100)
    ability: Optional[str] = None
    item: Optional[str] = None
    moves: list[str] = Field(default_factory=list, max_items=4)
    ivs: Dict[str, int] = Field(default_factory=dict)
    evs: Dict[str, int] = Field(default_factory=dict)
    nature: Optional[str] = None
    tera_type: Optional[str] = None
    position: int = Field(..., ge=1, le=6)

class TeamWithPokemonResponse(TeamResponse):
    pokemon_members: list[PokemonTeamMember] = Field(default_factory=list)

    # Para respuestas de equipos de usuario (con miembro)
class UserTeamResponse(TeamBase):
    id: UUID
    user_id: UUID  # Usuario miembro
    owner_user_id: UUID  # Dueño del equipo
    created_at: datetime
    status: str
    is_active: bool
    
    class Config:
        from_attributes = True