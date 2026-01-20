from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel

@dataclass
class Team:
    id: UUID
    name: str
    owner_user_id: UUID
    created_at: datetime
    status: str
    is_active: bool

@dataclass
class PokemonTeamMember:
    id: UUID
    team_id: UUID
    pokemon_id: int
    nickname: Optional[str]
    level: int
    ability: Optional[str]
    item: Optional[str]
    moves: list[str]
    ivs: Dict[str, int]
    evs: Dict[str, int]
    nature: Optional[str]
    tera_type: Optional[str]
    position: int
    created_at: datetime
    
@dataclass
class UserTeam:
    """Modelo específico para equipos de usuario (no confundir con Team)"""
    id: UUID
    name: str
    user_id: UUID  # ID del usuario miembro
    owner_user_id: UUID  # ID del dueño del equipo
    created_at: datetime
    status: str
    is_active: bool

@dataclass
class UserTeam:
    """Modelo específico para equipos de usuario (no confundir con Team)"""
    id: UUID
    name: str
    user_id: UUID  # ID del usuario miembro
    owner_user_id: UUID  # ID del dueño del equipo
    created_at: datetime
    status: str
    is_active: bool

@dataclass
class UserTeamResponse(BaseModel):
    id: UUID
    name: str
    user_id: UUID  # Este campo es REQUERIDO para que coincida
    owner_user_id: UUID
    created_at: datetime
    status: str
    is_active: bool
    
    class Config:
        from_attributes = True
