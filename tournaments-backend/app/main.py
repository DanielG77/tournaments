from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import tournaments
from api.routers.dashboard_player import players, teams, pokemon
from api.routers.dashboard_coach import coach

from infrastructure.database.connection import DatabaseConnection
from config.settings import settings

async def lifespan(app: FastAPI):
    # Startup: inicializa la pool
    await DatabaseConnection.get_pool()
    yield
    # Shutdown: cierra la pool
    await DatabaseConnection.close_pool()

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    redirect_slashes=False,   # ⚠️ importante
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # lista de orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],     # o los métodos que necesites
    allow_headers=["*"],     # o los headers que necesites
)

# DEBUG LOG para CORS
print("DEBUG – CORS_ORIGINS raw:", settings.CORS_ORIGINS)
print("DEBUG – type of CORS_ORIGINS:", type(settings.CORS_ORIGINS))

# Include routers
app.include_router(players.router)
app.include_router(teams.router)
app.include_router(pokemon.router)
app.include_router(tournaments.router)
app.include_router(coach.router)

@app.get("/")
async def root():
    return {
        "message": "Tournaments API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "connected"}
