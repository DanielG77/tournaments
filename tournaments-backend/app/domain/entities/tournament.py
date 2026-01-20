# domain/entities/tournament.py
from datetime import datetime, timezone
from uuid import UUID
from typing import Optional
from decimal import Decimal
from dataclasses import dataclass

@dataclass
class Tournament:
    """Domain entity representing a tournament"""
    id: UUID
    name: str
    start_at: datetime
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    price_client: Optional[Decimal] = None  # numeric(10,2)
    price_player: Optional[Decimal] = None  # numeric(10,2)
    is_active: Optional[bool] = None  # Si viene de DB

    def is_active(self) -> bool:
        """Check if tournament is currently active (computed from dates)."""
        now = datetime.now(timezone.utc)
        if self.end_date:
            return self.start_at <= now <= self.end_date
        return self.start_at <= now