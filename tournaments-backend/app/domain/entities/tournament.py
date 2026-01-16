from datetime import datetime
from uuid import UUID
from typing import Optional
from dataclasses import dataclass

@dataclass
class Tournament:
    """Domain entity representing a tournament"""
    id: UUID
    name: str
    start_date: datetime
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def is_active(self) -> bool:
        """Check if tournament is currently active"""
        now = datetime.now()
        if self.end_date:
            return self.start_date <= now <= self.end_date
        return self.start_date <= now