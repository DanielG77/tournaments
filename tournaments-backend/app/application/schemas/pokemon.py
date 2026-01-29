from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class PokemonMoveSchema(BaseModel):
    move_id: int
    name: Optional[str] = None

class PokemonStatsSchema(BaseModel):
    hp: int = Field(0, ge=0, le=252)
    atk: int = Field(0, ge=0, le=252)
    def_: int = Field(0, ge=0, le=252, alias="def")
    spa: int = Field(0, ge=0, le=252)
    spd: int = Field(0, ge=0, le=252)
    spe: int = Field(0, ge=0, le=252)

class PokemonTeamCreateSchema(BaseModel):
    name: str
    is_public: bool = False

class PokemonTeamMemberCreateSchema(BaseModel):
    position: int = Field(..., ge=1, le=6)
    pokemon_id: int
    nickname: Optional[str]
    level: int = Field(50, ge=1, le=100)
    nature: Optional[str]
    ability: Optional[str]
    held_item: Optional[str]
    shiny: bool = False
    ivs: Optional[PokemonStatsSchema]
    evs: Optional[PokemonStatsSchema]
    moves: Optional[List[PokemonMoveSchema]]

class PokemonTeamResponseSchema(BaseModel):
    id: UUID
    name: str
    is_public: bool
    created_at: str
