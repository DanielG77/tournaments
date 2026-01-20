from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

@dataclass
class UserGameAccount:
    id: UUID
    user_id: UUID
    game_key: str
    platform: Optional[str]
    platform_account_id: str
    display_name: Optional[str]
    created_at: datetime
    status: str
    is_active: bool
    