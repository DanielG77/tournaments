# infrastructure/external/redis_client.py
import redis.asyncio as redis
from config.settings import settings

class RedisClient:
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            cls._client = redis.from_url(
                settings.redis_url,  # ← Cambia REDIS_URL por redis_url
                decode_responses=True
            )
        return cls._client
    
    @classmethod
    async def close(cls):
        """Método para cerrar la conexión Redis"""
        if cls._client:
            await cls._client.close()
            cls._client = None