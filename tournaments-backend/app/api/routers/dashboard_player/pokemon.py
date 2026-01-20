from typing import List
from fastapi import APIRouter, HTTPException, status, Query
from application.schemas.dashboard_player.pokemon import PokemonResponse, PokemonSimple
from infrastructure.external.pokeapi_client import PokeAPIClient

router = APIRouter(prefix="/pokemon", tags=["pokemon"])

@router.get("/{identifier}", response_model=PokemonResponse)
async def get_pokemon(identifier: str):
    client = PokeAPIClient()
    try:
        pokemon_data = await client.get_pokemon(identifier)
        
        # Transformar los datos para nuestro schema
        pokemon_data['types'] = [
            {"slot": t['slot'], "type": {"name": t['type']['name']}} 
            for t in pokemon_data['types']
        ]
        
        pokemon_data['stats'] = [
            {
                "base_stat": s['base_stat'],
                "effort": s['effort'],
                "stat": {"name": s['stat']['name']}
            }
            for s in pokemon_data['stats']
        ]
        
        return PokemonResponse(**pokemon_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching Pokémon: {str(e)}"
        )
    finally:
        await client.close()

@router.get("/", response_model=List[PokemonSimple])
async def search_pokemon(
    query: str = Query(..., min_length=1, description="Pokemon name or ID"),
    limit: int = Query(20, ge=1, le=50, description="Maximum results to return")
):
    client = PokeAPIClient()
    try:
        results = await client.search_pokemon(query, limit)
        
        simple_results = []
        for pokemon in results:
            types = [t['type']['name'] for t in pokemon['types']]
            sprite_url = pokemon['sprites']['front_default']
            
            simple_results.append(
                PokemonSimple(
                    id=pokemon['id'],
                    name=pokemon['name'],
                    sprite_url=sprite_url,
                    types=types
                )
            )
        
        return simple_results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching Pokémon: {str(e)}"
        )
    finally:
        await client.close()