import json
import asyncio
import httpx

from infrastructure.external.redis_client import RedisClient


class PokeAPINotFound(Exception):
    pass


class PokeAPIClient:
    BASE_URL = "https://pokeapi.co/api/v2"
    TIMEOUT = 10.0
    MAX_RETRIES = 2

    _semaphore = asyncio.Semaphore(5)

    def __init__(self):
        self._client = httpx.AsyncClient(
            base_url=self.BASE_URL,
            timeout=self.TIMEOUT
        )

    async def _get(self, path: str):
        retries = 0

        while True:
            response = await self._client.get(path)

            if response.status_code == 404:
                raise PokeAPINotFound()

            if response.status_code == 429 and retries < self.MAX_RETRIES:
                retries += 1
                retry_after = int(response.headers.get("Retry-After", 1))
                await asyncio.sleep(retry_after)
                continue

            response.raise_for_status()
            return response.json()

    async def _cached_get(self, cache_key: str, ttl: int, fetcher):
        redis = None
        try:
            redis = RedisClient.get_client()
            cached = await redis.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            # Redis caído → seguimos sin cache
            pass

        async with self._semaphore:
            data = await fetcher()

        # Solo cacheamos si el fetch fue correcto
        if redis:
            try:
                await redis.set(cache_key, json.dumps(data), ex=ttl)
            except Exception:
                pass

        return data

    async def get_pokemon(self, id_or_name: str):
        return await self._cached_get(
            f"poke:pokemon:{id_or_name}",
            ttl=60 * 60 * 24,
            fetcher=lambda: self._get(f"/pokemon/{id_or_name}")
        )

    async def get_pokemon_species(self, id_or_name: str):
        return await self._cached_get(
            f"poke:species:{id_or_name}",
            ttl=60 * 60 * 24 * 7,
            fetcher=lambda: self._get(f"/pokemon-species/{id_or_name}")
        )

    async def get_move(self, id_or_name: str):
        return await self._cached_get(
            f"poke:move:{id_or_name}",
            ttl=60 * 60 * 24 * 7,
            fetcher=lambda: self._get(f"/move/{id_or_name}")
        )
