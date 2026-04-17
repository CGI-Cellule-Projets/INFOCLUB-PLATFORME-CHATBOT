from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlmodel import Session, select

from core.database import get_session
from core.security import verify_password, create_access_token, decode_access_token
from models.models import Member, MemberRead, MemberReadDetailed

router = APIRouter(prefix="/auth", tags=["🔐 Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


@router.post("/login", summary="Login with email + password")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    member = session.exec(
        select(Member).where(Member.email == form_data.username)
    ).first()

    if not member or not verify_password(form_data.password, member.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    token = create_access_token({"sub": str(member.id), "role": member.role})
    return {"access_token": token, "token_type": "bearer"}


# ── Reusable dependencies ────────────────────────────

def get_current_member(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> Member:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    member = session.get(Member, int(payload["sub"]))
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member

def get_current_member_optional(
    token: str = Depends(oauth2_scheme_optional),
    session: Session = Depends(get_session),
) -> Member:
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    return session.get(Member, int(payload["sub"]))


def require_head(current: Member = Depends(get_current_member)) -> Member:
    """
    Head only — full admin powers.
    The ONE thing only a Head can do that a Mod cannot: change roles.
    """
    if current.role != "head":
        raise HTTPException(status_code=403, detail="Only Heads can do this")
    return current


def require_mod_or_head(current: Member = Depends(get_current_member)) -> Member:
    """
    Mod or Head — used for most management actions:
    approve members, create events, write posts, see full member list.
    Cells are blocked.
    """
    if current.role not in ("head", "mod"):
        raise HTTPException(status_code=403, detail="You need to be a Mod or Head to do this")
    return current


@router.get("/me", response_model=MemberReadDetailed, summary="Get my profile")
def me(current: Member = Depends(get_current_member)):
    return current
