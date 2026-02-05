# infrastructure/repositories/admin/tournaments_repo.py
import json
from typing import List, Optional
from uuid import UUID
from infrastructure.database.connection import DatabaseConnection

# Inserta un torneo y devuelve la fila resultante como dict
async def insert_tournament(payload) -> dict | None:
    if hasattr(payload, "dict"):
        data = payload.dict()
    else:
        data = dict(payload or {})

    images = data.get("images", []) or []   # ← lista Python

    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO tournaments
            (name, description, images, status, start_at, end_at, price_client, price_player, is_active)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING id, name, description, images, status,
                    start_at, end_at, price_client, price_player,
                    is_active, created_at
            """,
            data["name"],
            data.get("description"),
            data.get("images", []),  # ✅ LISTA PYTHON
            data.get("status"),
            data.get("start_at"),
            data.get("end_at"),
            data.get("price_client"),
            data.get("price_player"),
            data.get("is_active", True),
        )


        return dict(row) if row else None

# Listar torneos (simple)
async def fetch_tournaments(skip: int = 0, limit: int = 50) -> List[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, name, description, images, status, start_at, end_at, price_client, price_player, is_active, created_at
            FROM tournaments
            ORDER BY created_at DESC
            OFFSET $1 LIMIT $2
            """,
            skip,
            limit,
        )
        return [dict(r) for r in rows]


# Obtener por id
async def fetch_tournament_by_id(tournament_id: UUID) -> Optional[dict]:
    pool = await DatabaseConnection.get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, name, description, images, status, start_at, end_at, price_client, price_player, is_active, created_at
            FROM tournaments
            WHERE id = $1
            """,
            tournament_id,
        )
        return dict(row) if row else None


# Update dinámico que solo actualiza los campos presentes en payload
async def update_tournament(tournament_id: UUID, payload) -> Optional[dict]:
    if hasattr(payload, "dict"):
        data = payload.dict(exclude_unset=True)
    else:
        data = dict(payload or {})

    if not data:
        return await fetch_tournament_by_id(tournament_id)

    pool = await DatabaseConnection.get_pool()

    params = []
    set_clauses = []
    idx = 1
    for key, val in data.items():
        if key == "images":
            params.append(json.dumps(val or []))
            set_clauses.append(f"{key} = ${idx}::jsonb")
        else:
            params.append(val)
            set_clauses.append(f"{key} = ${idx}")
        idx += 1

    params.append(tournament_id)
    sql = f"""
        UPDATE tournaments
        SET {', '.join(set_clauses)}
        WHERE id = ${idx}
        RETURNING id, name, description, images, status, start_at, end_at, price_client, price_player, is_active, created_at
    """

    async with pool.acquire() as conn:
        row = await conn.fetchrow(sql, *params)
        return dict(row) if row else None


# Soft delete - marca is_active = false
async def soft_delete_tournament(tournament_id: UUID) -> bool:
    pool = await DatabaseConnection.get_pool()

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE tournaments
            SET is_active = false
            WHERE id = $1
            RETURNING id
            """,
            tournament_id,
        )
        return bool(row)
    
async def delete_tournament(tournament_id: UUID) -> bool:
    pool = await DatabaseConnection.get_pool()

    async with pool.acquire() as conn:
        # Primero verificar si existe
        exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM tournaments WHERE id = $1)",
            tournament_id,
        )
        
        if not exists:
            return False
            
        # Luego eliminar
        await conn.execute(
            "DELETE FROM tournaments WHERE id = $1",
            tournament_id,
        )
        return True