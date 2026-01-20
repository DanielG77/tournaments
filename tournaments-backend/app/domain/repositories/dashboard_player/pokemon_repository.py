from abc import ABC, abstractmethod
from typing import Dict, Any, List

class PokemonAPIRepository(ABC):
    @abstractmethod
    async def get_pokemon(self, identifier: str) -> Dict[str, Any]:
        pass
    
    @abstractmethod
    async def search_pokemon(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        pass