from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncpg
from typing import Any
from uuid import UUID
import datetime

app = FastAPI(title="Tournaments - Minimal API")

# ---------------------
# Configuración CORS
# ---------------------
origins = [
    "http://localhost:5173",  # frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, etc.
    allow_headers=["*"],  # Content-Type, Authorization
)

# ---------------------
# Configuración DB
# ---------------------
DATABASE_CONFIG = {
    "user": "postgres",
    "password": ".",
    "database": "test_tournaments",
    "host": "localhost",
    "port": 5432,
}

@app.on_event("startup")
async def startup():
    """Crear pool de conexiones al iniciar la app"""
    try:
        app.state.pool = await asyncpg.create_pool(
            user=DATABASE_CONFIG["user"],
            password=DATABASE_CONFIG["password"],
            database=DATABASE_CONFIG["database"],
            host=DATABASE_CONFIG["host"],
            port=DATABASE_CONFIG["port"],
            min_size=1,
            max_size=5,
        )
    except Exception as e:
        app.state.pool = None
        raise

@app.on_event("shutdown")
async def shutdown():
    """Cerrar pool al apagar la app"""
    pool = getattr(app.state, "pool", None)
    if pool is not None:
        await pool.close()

# ---------------------
# Serializadores
# ---------------------
def _serialize_value(v: Any) -> Any:
    if v is None:
        return None
    if isinstance(v, UUID):
        return str(v)
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.isoformat()
    return v

def _serialize_record(record: asyncpg.Record) -> dict:
    return {k: _serialize_value(record[k]) for k in record.keys()}

# ---------------------
# Endpoints
# ---------------------
@app.get("/tournaments")
async def get_tournaments():
    pool = getattr(app.state, "pool", None)
    if pool is None:
        raise HTTPException(status_code=500, detail="No hay conexión a la base de datos")

    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM tournaments;")
    return [_serialize_record(r) for r in rows]

# ---------------------
# Run con python main.py
# ---------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
