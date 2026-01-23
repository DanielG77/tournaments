from typing import List, Optional
from uuid import UUID
from application.schemas.admin.registrations import RegistrationOut, RegistrationReviewIn
from infrastructure.repositories.admin.registrations_repo import (
    fetch_registrations,
    update_registration_review,
    insert_participant,
    update_participant_status,
)




async def list_registrations(status: Optional[str], skip: int, limit: int) -> List[RegistrationOut]:
    rows = await fetch_registrations(status, skip, limit)
    return [RegistrationOut(**r) for r in rows]




async def review_registration(participant_id: UUID, payload: RegistrationReviewIn, reviewer_id: str) -> Optional[RegistrationOut]:
    row = await update_registration_review(participant_id, payload, reviewer_id)
    if not row:
        return None
    return RegistrationOut(**row)   


async def create_participant(tournament_id: UUID, team_id: UUID, actor_user_id: str) -> RegistrationOut:
    row = await insert_participant(tournament_id, team_id)
    return RegistrationOut(**row)




async def change_participant_status(participant_id: UUID, payload: RegistrationReviewIn, reviewer_id: str) -> Optional[RegistrationOut]:
    row = await update_participant_status(participant_id, payload, reviewer_id)
    if not row:
        return None
    return RegistrationOut(**row)