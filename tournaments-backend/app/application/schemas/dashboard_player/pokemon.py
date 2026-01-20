from pydantic import BaseModel
from typing import List, Optional, Dict

class PokemonType(BaseModel):
    slot: int
    type: Dict[str, str]

class PokemonStat(BaseModel):
    base_stat: int
    effort: int
    stat: Dict[str, str]

class PokemonSprite(BaseModel):
    front_default: Optional[str]
    front_shiny: Optional[str]
    front_female: Optional[str] = None
    front_shiny_female: Optional[str] = None
    back_default: Optional[str]
    back_shiny: Optional[str]
    back_female: Optional[str] = None
    back_shiny_female: Optional[str] = None
    other: Optional[Dict] = None

class PokemonResponse(BaseModel):
    id: int
    name: str
    types: List[PokemonType]
    stats: List[PokemonStat]
    sprites: PokemonSprite
    height: int
    weight: int
    base_experience: int
    abilities: List[Dict]
    moves: List[Dict]
    species: Dict[str, str]

class PokemonSimple(BaseModel):
    id: int
    name: str
    sprite_url: Optional[str]
    types: List[str]