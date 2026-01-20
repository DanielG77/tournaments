import aiohttp
from typing import Dict, Any, List
import asyncio
from config.settings import settings
from domain.repositories.dashboard_player.pokemon_repository import PokemonAPIRepository

class PokeAPIClient(PokemonAPIRepository):
    def __init__(self):
        self.base_url = settings.POKEAPI_BASE_URL
        self.session = None
    
    async def _get_session(self):
        if not self.session:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def get_pokemon(self, identifier: str) -> Dict[str, Any]:
        session = await self._get_session()
        async with session.get(f"{self.base_url}/pokemon/{identifier}") as response:
            if response.status == 200:
                return await response.json()
            raise ValueError(f"Pokemon {identifier} not found")
    
    async def search_pokemon(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        session = await self._get_session()
        
        # Si el query es numérico, buscar por ID
        if query.isdigit():
            try:
                pokemon = await self.get_pokemon(query)
                return [pokemon]
            except:
                return []
        
        # Buscar por nombre (necesitamos obtener la lista primero)
        async with session.get(f"{self.base_url}/pokemon?limit=1000") as response:
            if response.status == 200:
                data = await response.json()
                results = data['results']
                
                # Filtrar por nombre que contenga el query
                filtered = [
                    result for result in results 
                    if query.lower() in result['name'].lower()
                ][:limit]
                
                # Obtener detalles de cada Pokémon
                pokemon_list = []
                for result in filtered:
                    try:
                        pokemon = await self.get_pokemon(result['name'])
                        pokemon_list.append(pokemon)
                    except:
                        continue
                
                return pokemon_list
        
        return []
    
    async def close(self):
        if self.session:
            await self.session.close()