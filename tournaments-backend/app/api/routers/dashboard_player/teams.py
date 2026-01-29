from typing import List, Optional
from uuid import UUID
from fastapi import Path
from fastapi import APIRouter, Depends, HTTPException, status, Query
from application.schemas.dashboard_player.team import (
    TeamCreate, 
    TeamResponse, 
    TeamUpdate, 
    TeamWithPokemonResponse,
    PokemonTeamMember
)
from application.schemas.dashboard_player.pokemon import PokemonResponse
from application.services.dashboard_player.team_service import TeamService
from infrastructure.repositories.dashboard_player.team_repository_impl import TeamRepositoryImpl
from infrastructure.repositories.dashboard_player.pokemon_team_member_repository_impl import PokemonTeamMemberRepositoryImpl
from infrastructure.external.pokeapi_client import PokeAPIClient


from application.schemas.pokemon import (
    PokemonTeamCreateSchema,
    PokemonTeamMemberCreateSchema
)
from application.services.dashboard_player.team_service import PokemonTeamService
from core.exceptions import NotFoundError, ForbiddenError, ValidationError
from api.dependencies.auth import get_current_user  # asumido existente


router = APIRouter(prefix="/teams", tags=["teams"])

service = PokemonTeamService()


def get_team_service():
    return TeamService(
        team_repo=TeamRepositoryImpl(),
        pokemon_member_repo=PokemonTeamMemberRepositoryImpl(),
        pokeapi_client=PokeAPIClient()
    )

# TODO: Implementar autenticación real
def get_current_user_id() -> UUID:
    # Por ahora, devolvemos un ID hardcodeado
    # En producción, extraer de JWT token
    return UUID("12345678-1234-1234-1234-123456789012")

@router.get("/me", response_model=List[TeamResponse])
async def get_my_teams(
    user_id: UUID = Depends(get_current_user_id),
    service: TeamService = Depends(get_team_service),
    game_key: Optional[str] = Query(None, description="Filter by game key"),
    is_public: Optional[bool] = Query(None, description="Filter by public/private")
):
    """Get all teams for the current user"""
    try:
        return await service.get_user_teams(user_id, game_key, is_public)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/me", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_data: TeamCreate,
    user_id: UUID = Depends(get_current_user_id),
    service: TeamService = Depends(get_team_service)
):
    """Create a new team for the current user"""
    try:
        return await service.create_team(user_id, team_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/me/{team_id}", response_model=TeamWithPokemonResponse)
async def get_team(
    team_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: TeamService = Depends(get_team_service)
):
    """Get a specific team with its Pokémon members"""
    try:
        team = await service.get_team_with_pokemon(user_id, team_id)
        if not team:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found or you don't have access"
            )
        return team
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.put("/me/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: UUID,
    team_update: TeamUpdate,
    user_id: UUID = Depends(get_current_user_id),
    service: TeamService = Depends(get_team_service)
):
    """Update a team"""
    try:
        return await service.update_team(user_id, team_id, team_update)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.delete("/me/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: UUID,
    user_id: UUID = Depends(get_current_user_id),
    service: TeamService = Depends(get_team_service)
):
    """Delete (soft delete) a team"""
    try:
        success = await service.delete_team(user_id, team_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Team not found or you don't have access"
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# @router.post("/me/{team_id}/pokemon", response_model=TeamWithPokemonResponse)
# async def add_pokemon_to_team(
#     team_id: UUID,
#     pokemon_data: PokemonTeamMember,
#     user_id: UUID = Depends(get_current_user_id),
#     service: TeamService = Depends(get_team_service)
# ):
#     """Add a Pokémon to a team"""
#     try:
#         return await service.add_pokemon_to_team(user_id, team_id, pokemon_data)
#     except ValueError as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e)
#         )

# @router.put("/me/{team_id}/pokemon/{pokemon_id}", response_model=TeamWithPokemonResponse)
# async def update_pokemon_in_team(
#     team_id: UUID,
#     pokemon_id: int,
#     pokemon_data: PokemonTeamMember,
#     user_id: UUID = Depends(get_current_user_id),
#     service: TeamService = Depends(get_team_service)
# ):
#     """Update a Pokémon in a team (by position)"""
#     try:
#         return await service.update_pokemon_in_team(user_id, team_id, pokemon_id, pokemon_data)
#     except ValueError as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e)
#         )


# @router.delete("/me/{team_id}/pokemon/{position}", response_model=TeamWithPokemonResponse)
# async def remove_pokemon_from_team(
#     team_id: UUID,
#     position: int = Path(..., ge=1, le=6, description="Position in team (1-6)"),
#     user_id: UUID = Depends(get_current_user_id),
#     service: TeamService = Depends(get_team_service)
# ):
#     """Remove a Pokémon from a team by position"""
#     try:
#         return await service.remove_pokemon_from_team(user_id, team_id, position)
#     except ValueError as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e)
#         )


# @router.get("/public", response_model=List[TeamResponse])
# async def get_public_teams(
#     game_key: str = Query("pokemon", description="Filter by game key"),
#     limit: int = Query(20, ge=1, le=100, description="Number of teams to return"),
#     offset: int = Query(0, ge=0, description="Pagination offset"),
#     service: TeamService = Depends(get_team_service)
# ):
#     """Get public teams from all users"""
#     try:
#         return await service.get_public_teams(game_key, limit, offset)
#     except ValueError as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e)
#         )

# @router.get("/me/{team_id}/pokemon/{pokemon_id}/details", response_model=PokemonResponse)
# async def get_pokemon_details_for_team(
#     team_id: UUID,
#     pokemon_id: int,
#     user_id: UUID = Depends(get_current_user_id),
#     service: TeamService = Depends(get_team_service)
# ):
#     """Get detailed information for a Pokémon in a team"""
#     try:
#         pokemon_details = await service.get_pokemon_details_for_team(user_id, team_id, pokemon_id)
#         if not pokemon_details:
#             raise HTTPException(
#                 status_code=status.HTTP_404_NOT_FOUND,
#                 detail="Pokemon not found in team or team not accessible"
#             )
#         return pokemon_details
#     except ValueError as e:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail=str(e)
#         )
    




@router.get("")
async def list_my_pokemon_teams(user=Depends(get_current_user)):
    return await service.list_my_teams(user.id)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_pokemon_team(
    payload: PokemonTeamCreateSchema,
    user=Depends(get_current_user)
):
    return {
        "team_id": await service.create_team(
            user.id,
            payload.name,
            payload.is_public
        )
    }


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pokemon_team(
    team_id: UUID,
    user=Depends(get_current_user)
):
    await service.delete_team(user.id, team_id)


@router.post("/{team_id}/members", status_code=status.HTTP_201_CREATED)
async def add_pokemon_member(
    team_id: UUID,
    payload: PokemonTeamMemberCreateSchema,
    user=Depends(get_current_user)
):
    try:
        member_id = await service.add_member(
            user.id,
            team_id,
            payload.model_dump(by_alias=True, exclude_none=True)
        )
        return {"member_id": member_id}
    except NotFoundError as e:
        return _http_error(404, str(e))
    except ForbiddenError as e:
        return _http_error(403, str(e))
    except ValidationError as e:
        return _http_error(400, str(e))


@router.delete("/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pokemon_member(
    member_id: int,
    user=Depends(get_current_user)
):
    try:
        await service.delete_member(user.id, member_id)
    except NotFoundError as e:
        return _http_error(404, str(e))
    except ForbiddenError as e:
        return _http_error(403, str(e))


def _http_error(status_code: int, detail: str):
    from fastapi import HTTPException
    raise HTTPException(status_code=status_code, detail=detail)
