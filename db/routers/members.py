from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from core.database import get_session
from core.security import hash_password
from models.models import Member, MemberCreate, MemberRead, MemberUpdate, MemberStatus
from routers.auth import get_current_member, require_head, require_mod_or_head

router = APIRouter(prefix="/members", tags=["👥 Members"])


@router.post("/register", response_model=MemberRead, status_code=201,
             summary="Register a new member (starts as pending)")
def register(data: MemberCreate, session: Session = Depends(get_session)):
    if session.exec(select(Member).where(Member.email == data.email)).first():
        raise HTTPException(400, "Email already registered")
    member = Member(
        **data.model_dump(exclude={"password"}),
        hashed_password=hash_password(data.password),
    )
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.get("/", response_model=List[MemberRead],
            summary="List all members — Mod or Head only")
def list_members(
    session: Session = Depends(get_session),
    _: Member = Depends(require_mod_or_head),
):
    return session.exec(select(Member)).all()


@router.get("/pending", response_model=List[MemberRead],
            summary="List all pending members waiting for approval — Mod or Head only")
def list_pending(
    session: Session = Depends(get_session),
    _: Member = Depends(require_mod_or_head),
):
    return session.exec(select(Member).where(Member.status == MemberStatus.pending)).all()


@router.post("/{member_id}/approve", response_model=MemberRead,
             summary="Approve a pending member — Mod or Head only")
def approve_member(
    member_id: int,
    session: Session = Depends(get_session),
    _: Member = Depends(require_mod_or_head),
):
    member = session.get(Member, member_id)
    if not member:
        raise HTTPException(404, "Member not found")
    if member.status != MemberStatus.pending:
        raise HTTPException(400, "Member is not pending")
    member.status = MemberStatus.active
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.post("/{member_id}/reject", response_model=MemberRead,
             summary="Reject a pending member — Mod or Head only")
def reject_member(
    member_id: int,
    session: Session = Depends(get_session),
    _: Member = Depends(require_mod_or_head),
):
    member = session.get(Member, member_id)
    if not member:
        raise HTTPException(404, "Member not found")
    member.status = MemberStatus.inactive
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.post("/{member_id}/assign-mod", response_model=MemberRead,
             summary="Assign or remove the Mod role — Head only")
def assign_mod(
    member_id: int,
    session: Session = Depends(get_session),
    _: Member = Depends(require_head),         # ← ONLY Heads can do this
):
    member = session.get(Member, member_id)
    if not member:
        raise HTTPException(404, "Member not found")
    if member.role == "head":
        raise HTTPException(400, "Cannot change a Head's role")
    # Toggle: if already mod → back to cell, if cell → become mod
    member.role = "cell" if member.role == "mod" else "mod"
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.get("/cells", response_model=List[MemberRead],
            summary="List all Cells under my command — Head only")
def my_cells(
    session: Session = Depends(get_session),
    current: Member = Depends(require_head),
):
    return session.exec(select(Member).where(Member.head_id == current.id)).all()


@router.get("/{member_id}", response_model=MemberRead)
def get_member(
    member_id: int,
    session: Session = Depends(get_session),
    current: Member = Depends(get_current_member),
):
    # Cells can only see themselves; Mods and Heads can see anyone
    if current.role == "cell" and current.id != member_id:
        raise HTTPException(403, "Not allowed")
    member = session.get(Member, member_id)
    if not member:
        raise HTTPException(404, "Member not found")
    return member


@router.patch("/{member_id}", response_model=MemberRead,
              summary="Update a member's details")
def update_member(
    member_id: int,
    updates: MemberUpdate,
    session: Session = Depends(get_session),
    current: Member = Depends(get_current_member),
):
    # Cells can only update themselves; Mods and Heads can update anyone
    if current.role == "cell" and current.id != member_id:
        raise HTTPException(403, "Not allowed")

    # Only Heads can change roles — block Mods from doing it
    if updates.role is not None and current.role != "head":
        raise HTTPException(403, "Only Heads can change roles")

    member = session.get(Member, member_id)
    if not member:
        raise HTTPException(404, "Member not found")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.delete("/{member_id}", status_code=204,
               summary="Delete a member permanently — Head only")
def delete_member(
    member_id: int,
    session: Session = Depends(get_session),
    _: Member = Depends(require_head),         # ← ONLY Heads can delete
):
    member = session.get(Member, member_id)
    if not member:
        raise HTTPException(404, "Member not found")
    session.delete(member)
    session.commit()
