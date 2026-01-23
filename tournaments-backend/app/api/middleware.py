from fastapi import Request, HTTPException, status
from typing import Dict, Tuple
import time

# Simple in-memory rate limiter: dict[ip, list[timestamps]]
# For production, use Redis.
_request_records: Dict[str, list] = {}

class RateLimiter:
    def __init__(self, requests_limit: int = 5, window_seconds: int = 60):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds

    async def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "127.0.0.1"
        now = time.time()
        
        # Initialize if not exists
        if client_ip not in _request_records:
            _request_records[client_ip] = []
            
        # Filter old timestamps
        window_start = now - self.window_seconds
        _request_records[client_ip] = [t for t in _request_records[client_ip] if t > window_start]
        
        # Check limit
        if len(_request_records[client_ip]) >= self.requests_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later."
            )
            
        # Add current timestamp
        _request_records[client_ip].append(now)
