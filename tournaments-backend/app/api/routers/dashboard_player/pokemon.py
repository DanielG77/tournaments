from fastapi import APIRouter
from infrastructure.external.pokeapi_client import PokeAPIClient, PokeAPINotFound

router = APIRouter(
    prefix="/dashboard/player/pokemon",
    tags=["Dashboard Player - Pokémon"]
)

client = PokeAPIClient()


@router.get("/{id_or_name}")
async def get_pokemon(id_or_name: str):
    try:
        return await client.get_pokemon(id_or_name)
    except PokeAPINotFound:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pokémon not found")
