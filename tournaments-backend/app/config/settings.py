# app/config/settings.py
from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional

# Obtener la ruta base del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # Database
    db_user: str = "postgres"
    db_password: str = "."
    db_name: str = "test_tournaments"
    db_host: str = "localhost"
    db_port: int = 5432
    
    # Database pool settings
    db_min_size: int = 1
    db_max_size: int = 5
    
    # Application
    app_title: str = "Tournaments API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    @property
    def database_url(self) -> str:
        return f"postgresql://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"
    
    class Config:
        # Buscar .env en múltiples ubicaciones
        env_file = [
            BASE_DIR / ".env",  # En raíz del proyecto
            ".env",  # En directorio actual
            BASE_DIR.parent / ".env"  # Un nivel arriba
        ]
        env_file_encoding = 'utf-8'
        case_sensitive = False

settings = Settings()