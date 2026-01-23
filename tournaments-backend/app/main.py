from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import tournaments

from api.routers.dashboard_player import players, teams, pokemon

from api.routers.dashboard_coach import coach

from api.routers.admin import tournaments_adm, teams_adm, registrations_adm, players_adm

from api.routers import auth

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



@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # lista de orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],     # o los métodos que necesites
    allow_headers=["*"],     # o los headers que necesites
)

# DEBUG LOG para CORS
# print("DEBUG – CORS_ORIGINS raw:", settings.CORS_ORIGINS)
# print("DEBUG – type of CORS_ORIGINS:", type(settings.CORS_ORIGINS))

# Include routers
app.include_router(tournaments.router)

app.include_router(players.router)
app.include_router(teams.router)
app.include_router(pokemon.router)

app.include_router(coach.router)

app.include_router(tournaments_adm.router)
app.include_router(teams_adm.router)
app.include_router(registrations_adm.router)
app.include_router(players_adm.router)

app.include_router(auth.router)

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
