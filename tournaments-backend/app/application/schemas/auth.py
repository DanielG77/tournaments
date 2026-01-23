# src/application/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    role: str = Field(..., pattern="^(player|coach|admin)$")
    nickname: Optional[str] = None  # para players, opcional

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    refresh_token: Optional[str]
    token_type: str = "bearer"
    expires_in: int  # segundos

class MeOut(BaseModel):
    id: str
    email: EmailStr
    role: str
    avatar_url: Optional[str]
