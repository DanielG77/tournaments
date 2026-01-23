from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime




class PlayerOut(BaseModel):
    id: UUID
    email: str
    nickname: Optional[str]
    created_at: datetime