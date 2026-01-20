# config/settings.py
from typing import List, Optional
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

# Obtener la ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    db_user: str = Field(..., env="DB_USER")
    db_password: str = Field(..., env="DB_PASSWORD")
    db_name: str = Field(..., env="DB_NAME")
    db_host: str = Field("localhost", env="DB_HOST")
    db_port: int = Field(5432, env="DB_PORT")
    db_min_size: int = Field(1, env="DB_MIN_SIZE")
    db_max_size: int = Field(10, env="DB_MAX_SIZE")

    DATABASE_URL: Optional[str] = Field(None, env="DATABASE_URL")
    POKEAPI_BASE_URL: str = "https://pokeapi.co/api/v2"

    # Dejar default vacío; se rellenará desde .env si existe
    CORS_ORIGINS: List[str] = Field(default_factory=list, env="CORS_ORIGINS")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        # Si viene como string "a,b", convertir a lista
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    APP_NAME: str = Field("Tournaments API", env="APP_NAME")
    DEBUG: bool = Field(False, env="DEBUG")

    class Config:
        # Buscar .env en múltiples ubicaciones
        env_file = [
            BASE_DIR / ".env",  # En raíz del proyecto
            ".env",  # En directorio actual
            BASE_DIR.parent / ".env"  # Un nivel arriba
        ]
        env_file_encoding = 'utf-8'
        case_sensitive = False

# Instancia final
settings = Settings()
