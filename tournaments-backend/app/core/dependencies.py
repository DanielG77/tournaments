from typing import Generator
from infrastructure.repositories.tournament_repository_impl import TournamentRepositoryImpl
from application.services.tournament_service import TournamentService

def get_tournament_repository() -> TournamentRepositoryImpl:
    """Dependency for tournament repository"""
    return TournamentRepositoryImpl()

def get_tournament_service(
    repository: TournamentRepositoryImpl = Depends(get_tournament_repository)
) -> TournamentService:
    """Dependency for tournament service"""
    return TournamentService(repository)