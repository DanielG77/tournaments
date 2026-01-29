# src/api/routers/tournaments.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
import asyncpg
from uuid import UUID
from pydantic import BaseModel

from application.services.tournament_service import TournamentService
from infrastructure.repositories.tournament_repository_impl import TournamentRepositoryImpl
from application.schemas.tournament import TournamentResponse
from core.dependencies import get_tournament_service

# IMPORTS QUE FALTABAN
from infrastructure.database.connection import DatabaseConnection

# Intentamos usar la dependencia real de auth si existe; si no, damos un fallback claro.
try:
    # Debes tener en core.dependencies algo como: async def get_current_user_id(...) -> UUID: ...
    from core.dependencies import get_current_user_id
except Exception:
    async def get_current_user_id():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Dependency 'get_current_user_id' no encontrada. Implementa una dependencia que devuelva el UUID del usuario autenticado en core.dependencies."
        )

router = APIRouter(prefix="/tournaments", tags=["tournaments"])

@router.get("", response_model=List[TournamentResponse])
@router.get("/", response_model=List[TournamentResponse])
async def get_tournaments(
    service: TournamentService = Depends(get_tournament_service)
):
    """Get all tournaments"""
    try:
        tournaments = await service.get_all_tournaments()
        return tournaments
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{tournament_id}", response_model=TournamentResponse)
async def get_tournament_by_id(
    tournament_id: UUID,
    service: TournamentService = Depends(get_tournament_service)
):
    """Get a specific tournament by ID"""
    try:
        tournament = await service.get_tournament_by_id(tournament_id)
        if not tournament:
            raise HTTPException(
                status_code=404,
                detail=f"Tournament with ID {tournament_id} not found"
            )
        return tournament
    except asyncpg.PostgresError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

# ------------------------
# MODELO DE REQUEST (faltaba)
# ------------------------
class TournamentRegisterRequest(BaseModel):
    team_id: UUID

@router.post("/{tournament_id}/register")
async def register_team_to_tournament(
    tournament_id: UUID,
    payload: TournamentRegisterRequest,
    current_user_id: UUID = Depends(get_current_user_id)   # asumo que ya tienes esta dependencia
):
    """
    Registra un team_id en tournaments_participants (registration_status = 'pending')
    y además inserta cada miembro del equipo en tournaments_participants_members con estado 'pending'.
    """
    try:
        async with DatabaseConnection.get_connection() as conn:
            async with conn.transaction():

                # 1) Torneo válido y activo
                tournament = await conn.fetchrow(
                    "SELECT id, is_active FROM tournaments WHERE id = $1",
                    tournament_id
                )
                if not tournament or not tournament["is_active"]:
                    raise HTTPException(status_code=404, detail="Tournament not available")

                # 2) Equipo válido y activo
                team = await conn.fetchrow(
                    "SELECT id, owner_user_id, coach_user_id, is_active FROM teams WHERE id = $1",
                    payload.team_id
                )
                if not team or not team["is_active"]:
                    raise HTTPException(status_code=404, detail="Team not available")

                # 3) Permisos: owner, coach o miembro
                is_owner_or_coach = (
                    (team["owner_user_id"] is not None and str(team["owner_user_id"]) == str(current_user_id))
                    or (team["coach_user_id"] is not None and str(team["coach_user_id"]) == str(current_user_id))
                )

                is_member = await conn.fetchrow(
                    "SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2",
                    payload.team_id, current_user_id
                )

                if not (is_owner_or_coach or is_member):
                    raise HTTPException(status_code=403, detail="You cannot register this team")

                # 4) Evitar duplicados (un team por torneo)
                exists = await conn.fetchrow(
                    "SELECT 1 FROM tournaments_participants WHERE tournament_id = $1 AND team_id = $2",
                    tournament_id, payload.team_id
                )
                if exists:
                    raise HTTPException(status_code=400, detail="Team already registered for this tournament")

                # 5) Insertar participante (registro de equipo)
                participant = await conn.fetchrow(
                    """
                    INSERT INTO tournaments_participants (
                        tournament_id,
                        team_id,
                        registration_status
                    )
                    VALUES ($1, $2, 'pending')
                    RETURNING id, registration_status, applied_at
                    """,
                    tournament_id, payload.team_id
                )

                participant_id = participant["id"]

                # 6) Obtener miembros actuales del equipo
                members = await conn.fetch(
                    """
                    SELECT tm.user_id, tm.role
                    FROM team_members tm
                    WHERE tm.team_id = $1
                    """,
                    payload.team_id
                )

                # 7) Insertar cada miembro en tournaments_participants_members con estado 'pending'
                #    (si no hay miembros, no insertamos)
                members_inserted = 0
                if members:
                    # Inserción por lotes: construimos un batch
                    insert_sql = """
                        INSERT INTO tournaments_participants_members (
                            participant_id, user_id, role, registration_status
                        ) VALUES ($1, $2, $3, 'pending')
                    """
                    for m in members:
                        await conn.execute(insert_sql, participant_id, m["user_id"], m.get("role", "member"))
                        members_inserted += 1

                return {
                    "participant_id": str(participant_id),
                    "status": participant["registration_status"],
                    "applied_at": participant["applied_at"].isoformat() if participant["applied_at"] else None,
                    "members_registered": members_inserted,
                    "message": "Team successfully registered and its members recorded as pending"
                }

    except asyncpg.PostgresError as e:
        # Puedes loggear e.detail (si usas logger)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{tournament_id}/coach/{coach_id}/eligible-teams")
async def list_eligible_teams_for_tournament(tournament_id: UUID, coach_id: UUID):
    """
    Devuelve los equipos del coach (owner o coach_user_id) que NO están registrados
    en el torneo indicado.
    """
    async with DatabaseConnection.get_connection() as conn:
        rows = await conn.fetch(
            """
            SELECT t.id, t.name, t.status, t.is_active,
                   (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) AS players_count,
                   t.created_at
            FROM teams t
            WHERE (t.owner_user_id = $1 OR t.coach_user_id = $1)
              AND t.is_active = true
              AND NOT EXISTS (
                SELECT 1 FROM tournaments_participants tp
                WHERE tp.tournament_id = $2 AND tp.team_id = t.id
              )
            ORDER BY t.name
            """,
            coach_id, tournament_id
        )
        teams = []
        for r in rows:
            teams.append({
                "id": str(r["id"]),
                "name": r["name"],
                "status": r["status"],
                "is_active": r["is_active"],
                "players_count": int(r["players_count"] or 0),
                "created_at": r["created_at"].isoformat() if r["created_at"] else None
            })

        if not teams:
            return {"teams": [], "message": "No eligible teams (either none or already registered)"}

        return {"teams": teams}
