from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime




class RuleCreate(BaseModel):
    key: Optional[str]
    content: str




class RuleOut(BaseModel):
    id: UUID
    tournament_id: UUID
    key: Optional[str]
    content: str
    created_at: datetime