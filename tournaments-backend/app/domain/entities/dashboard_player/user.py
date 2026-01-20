from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional
from uuid import UUID

@dataclass
class User:
    id: UUID
    email: str
    password_hash: str
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    date_born: Optional[date] = None
    avatar_url: Optional[str] = None

@dataclass
class PlayerProfile:
    user_id: UUID
    nickname: Optional[str]
    created_at: datetime
    updated_at: datetime