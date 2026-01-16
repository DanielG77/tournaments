import asyncpg
from typing import Optional
from contextlib import asynccontextmanager
from config.settings import settings

class DatabaseConnection:
    """Manages database connection pool"""
    
    _pool: Optional[asyncpg.Pool] = None
    
    @classmethod
    async def get_pool(cls) -> asyncpg.Pool:
        """Get or create connection pool"""
        if cls._pool is None:
            cls._pool = await asyncpg.create_pool(
                user=settings.db_user,
                password=settings.db_password,
                database=settings.db_name,
                host=settings.db_host,
                port=settings.db_port,
                min_size=settings.db_min_size,
                max_size=settings.db_max_size,
            )
        return cls._pool
    
    @classmethod
    async def close_pool(cls):
        """Close connection pool"""
        if cls._pool:
            await cls._pool.close()
            cls._pool = None
    
    @classmethod
    @asynccontextmanager
    async def get_connection(cls):
        """Context manager for database connection"""
        pool = await cls.get_pool()
        async with pool.acquire() as connection:
            yield connection