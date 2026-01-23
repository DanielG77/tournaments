# src/api/routers/auth.py
from fastapi import APIRouter, HTTPException, Depends, Request, status
from application.schemas.auth import RegisterIn, LoginIn, TokenOut, MeOut
from application.services.auth_service import AuthService
from core.security import decode_token
from config.settings import settings
import jwt

from api.middleware import RateLimiter

router = APIRouter(prefix="/auth", tags=["auth"])

limiter = RateLimiter(requests_limit=5, window_seconds=60)

@router.post("/register", response_model=MeOut, status_code=201, dependencies=[Depends(limiter)])
async def register(payload: RegisterIn):
    # Validaciones básicas (email unique) -> la BD lanzará error si no unique
    try:
        user = await AuthService.register_user(payload.email, payload.password, payload.role, payload.nickname)
    except Exception as e:
        # Si el email ya existe, asyncpg lanzará UniqueViolation; mapea a 400 o 409
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "id": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "avatar_url": user.get("avatar_url")
    }

@router.post("/login", response_model=TokenOut, dependencies=[Depends(limiter)])
async def login(payload: LoginIn, request: Request):
    user = await AuthService.authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    tokens = await AuthService.create_tokens_for_user(user, ip=ip, user_agent=user_agent)
    return {
        "access_token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "expires_in": tokens["expires_in"],
        "token_type":"bearer"
    }

@router.post("/refresh", response_model=TokenOut)
async def refresh(body: dict):
    # body expected: {"refresh_token": "<token>"}
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="Missing refresh_token")
    try:
        payload = decode_token(token, verify_refresh=True)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Token is not a refresh token")

    jti = payload.get("jti")
    sub = payload.get("sub")
    if not jti or not sub:
        raise HTTPException(status_code=401, detail="Malformed refresh token")

    # Validar contra BD
    valid = await AuthService.validate_refresh_token_jti(jti)
    if not valid:
        raise HTTPException(status_code=401, detail="Refresh token invalid or revoked")

    # Opcional: rotation
    rotated = await AuthService.rotate_refresh_token(jti, sub)
    if not rotated:
        raise HTTPException(status_code=401, detail="Could not rotate refresh token")
    return {
        "access_token": rotated["access_token"],
        "refresh_token": rotated["refresh_token"],
        "expires_in": rotated["expires_in"],
        "token_type":"bearer"
    }

@router.post("/logout")
async def logout(body: dict = None, request: Request = None):
    token = None
    if body:
        token = body.get("refresh_token")
    if not token and request:
        auth = request.headers.get("authorization")
        if auth and auth.split()[0].lower() == "bearer":
            token = auth.split()[1]
    if not token:
        raise HTTPException(status_code=400, detail="Missing refresh token")

    try:
        payload = decode_token(token, verify_refresh=True)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Expected refresh token")

    jti = payload.get("jti")
    await AuthService.revoke_refresh_token(jti)
    return {"detail": "Logged out (refresh token revoked)"}

@router.post("/logout-all")
async def logout_all(body: dict = None, request: Request = None):
    # TODO: Refactor dependency injection for token extraction
    # This assumes we get a valid refresh token or access token to identify the user
    # For security, logout-all typically requires a valid ACCESS token or REFRESH token
    # Here we simulate extracting user_id from a provided refresh token for simplicity tailored to current context
    # ideally should require authentication via access token
    
    token = None
    if body:
        token = body.get("refresh_token")
    if not token and request:
        auth = request.headers.get("authorization")
        if auth and auth.split()[0].lower() == "bearer":
             token = auth.split()[1]
    
    if not token:
        raise HTTPException(status_code=400, detail="Missing token")

    try:
        # Accept either access or refresh token to identify user
        # Trying refresh first (common for logout endpoints)
        payload = decode_token(token, verify_refresh=True)
    except:
        try:
             payload = decode_token(token, verify_refresh=False)
        except:
             raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    await AuthService.revoke_all_user_refresh_tokens(user_id)
    return {"detail": "Logged out from all devices"}

@router.get("/me", response_model=MeOut)
async def me(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    
    token = auth_header.split()[1]
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
        
    user = await AuthService.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": str(user["id"]),
        "email": user["email"],
        "role": user["role"],
        "avatar_url": user.get("avatar_url")
    }
