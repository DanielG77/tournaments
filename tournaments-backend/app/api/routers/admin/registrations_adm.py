from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from application.schemas.admin.registrations import RegistrationOut, RegistrationReviewIn
from application.services.admin.registrations_service import (
list_registrations,
review_registration,
create_participant,
change_participant_status,
)
from api.dependencies.admin import get_admin_user


router = APIRouter(prefix="/admin/registrations", tags=["admin:registrations"])




@router.get("/", response_model=List[RegistrationOut])
async def get_registrations(status: Optional[str] = None, skip: int = 0, limit: int = 50, user_id: str = Depends(get_admin_user)):
    return await list_registrations(status, skip, limit)




@router.put("/{participant_id}/review", response_model=RegistrationOut)
async def put_review(participant_id: UUID, payload: RegistrationReviewIn, user_id: str = Depends(get_admin_user)):
    out = await review_registration(participant_id, payload, user_id)
    if not out:
        raise HTTPException(status_code=404, detail="Participant not found")
    return out




@router.post("/tournaments/{tournament_id}/participants", response_model=RegistrationOut)
async def post_participant(tournament_id: UUID, team_id: UUID, user_id: str = Depends(get_admin_user)):
    return await create_participant(tournament_id, team_id, user_id)




@router.put("/participants/{participant_id}/status", response_model=RegistrationOut)
async def put_participant_status(participant_id: UUID, payload: RegistrationReviewIn, user_id: str = Depends(get_admin_user)):
    out = await change_participant_status(participant_id, payload, user_id)
    if not out:
        raise HTTPException(status_code=404, detail="Participant not found")
    return out