from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, extract
from typing import List, Optional

from core.database import get_session
from models.models import (
    Event, EventCreate, EventRead, EventUpdate,
    EventAttendance, AttendanceCreate, AttendanceRead,
    Member,
)
from routers.auth import get_current_member, require_head, require_mod_or_head

router = APIRouter(prefix="/events", tags=["📅 Events"])


@router.post("/", response_model=EventRead, status_code=201,
             summary="Create a new event (Head only)")
def create_event(
    data: EventCreate,
    session: Session = Depends(get_session),
    current: Member = Depends(require_head),
):
    event = Event(**data.model_dump(), created_by_id=current.id)
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.get("/", response_model=List[EventRead], summary="List all events")
def list_events(
    type: Optional[str] = Query(None, description="Filter by event type (e.g. workshop, ctf)"),
    month: Optional[int] = Query(None, description="Filter by month (1-12)"),
    session: Session = Depends(get_session),
    _: Member = Depends(get_current_member)
):
    query = select(Event)
    if type:
        query = query.where(Event.event_type == type)
    if month:
        query = query.where(extract('month', Event.starts_at) == month)
        
    return session.exec(query).all()


@router.get("/{event_id}", response_model=EventRead)
def get_event(event_id: int, session: Session = Depends(get_session),
              _: Member = Depends(get_current_member)):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    return event


@router.patch("/{event_id}", response_model=EventRead, summary="Update an event (Head only)")
def update_event(
    event_id: int,
    updates: EventUpdate,
    session: Session = Depends(get_session),
    _: Member = Depends(require_mod_or_head),
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    session.add(event)
    session.commit()
    session.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204, summary="Delete an event (Head only)")
def delete_event(event_id: int, session: Session = Depends(get_session),
                 _: Member = Depends(require_head)):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Event not found")
    session.delete(event)
    session.commit()


# ── Attendance ───────────────────────────────────────

@router.post("/{event_id}/attend", response_model=AttendanceRead,
             summary="RSVP to an event")
def attend_event(
    event_id: int,
    data: AttendanceCreate,
    session: Session = Depends(get_session),
    current: Member = Depends(get_current_member),
):
    event = session.get(Event, event_id)
    if not event:
        raise HTTPException(404, "Event not found")

    existing = session.exec(
        select(EventAttendance)
        .where(EventAttendance.member_id == current.id)
        .where(EventAttendance.event_id == event_id)
    ).first()
    if existing:
        raise HTTPException(400, "Already registered for this event")

    attendance = EventAttendance(
        member_id=current.id, event_id=event_id, status=data.status
    )
    session.add(attendance)
    session.commit()
    session.refresh(attendance)
    return attendance


@router.get("/{event_id}/attendees", response_model=List[AttendanceRead],
            summary="See who is attending (Head only)")
def event_attendees(event_id: int, session: Session = Depends(get_session),
                    _: Member = Depends(require_head)):
    return session.exec(
        select(EventAttendance).where(EventAttendance.event_id == event_id)
    ).all()
