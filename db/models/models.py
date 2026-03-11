from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship


# ══════════════════════════════════════════════════════
#  ENUMS
# ══════════════════════════════════════════════════════

class MemberRole(str, Enum):
    """
    head  = club leader / board member (full admin powers + can assign mods)
    mod   = moderator (can manage members, events, posts but cannot change roles)
    cell  = regular member (can read, RSVP, like posts)
    """
    head = "head"
    mod  = "mod"
    cell = "cell"


class MemberStatus(str, Enum):
    active   = "active"
    inactive = "inactive"
    pending  = "pending"   # waiting for approval


class EventStatus(str, Enum):
    upcoming  = "upcoming"
    ongoing   = "ongoing"
    finished  = "finished"
    cancelled = "cancelled"


# ══════════════════════════════════════════════════════
#  MEMBERS TABLE
#  - Heads are club leaders
#  - Cells are regular members linked to a Head
# ══════════════════════════════════════════════════════

class MemberBase(SQLModel):
    full_name:     str            = Field(index=True)
    email:         str            = Field(unique=True, index=True)
    student_id:    Optional[str]  = Field(default=None, unique=True)
    major:         Optional[str]  = None
    year_of_study: Optional[int]  = None          # 1 / 2 / 3 / 4
    phone:         Optional[str]  = None
    role:          MemberRole     = Field(default=MemberRole.cell)
    status:        MemberStatus   = Field(default=MemberStatus.pending)
    joined_at:     datetime       = Field(default_factory=datetime.utcnow)

    # A Cell belongs to a Head (self-referencing FK)
    head_id: Optional[int] = Field(default=None, foreign_key="member.id")


class Member(MemberBase, table=True):
    id:              Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str

    # Self-referencing: one Head → many Cells
    cells: List["Member"] = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "Member.head_id == Member.id",
            "foreign_keys": "[Member.head_id]",
            "lazy": "select",
        }
    )

    # A member can attend many events
    attendances: List["EventAttendance"] = Relationship(back_populates="member")

    # A member can write many posts
    posts: List["Post"] = Relationship(back_populates="author")


# ── API Schemas ──────────────────────────────────────
class MemberCreate(MemberBase):
    password: str


class MemberRead(MemberBase):
    id: int


class MemberUpdate(SQLModel):
    full_name:     Optional[str]          = None
    phone:         Optional[str]          = None
    major:         Optional[str]          = None
    year_of_study: Optional[int]          = None
    status:        Optional[MemberStatus] = None
    role:          Optional[MemberRole]   = None
    head_id:       Optional[int]          = None


# ══════════════════════════════════════════════════════
#  EVENTS TABLE
#  Temporal data for scheduling club meetings/trips/etc.
# ══════════════════════════════════════════════════════

class EventBase(SQLModel):
    title:         str            = Field(index=True)
    description:   Optional[str] = None
    location:      Optional[str] = None
    starts_at:     datetime
    ends_at:       Optional[datetime] = None
    status:        EventStatus    = Field(default=EventStatus.upcoming)
    max_attendees: Optional[int]  = None   # None = unlimited


class Event(EventBase, table=True):
    id:            Optional[int] = Field(default=None, primary_key=True)
    created_at:    datetime      = Field(default_factory=datetime.utcnow)
    created_by_id: Optional[int] = Field(default=None, foreign_key="member.id")

    attendances: List["EventAttendance"] = Relationship(back_populates="event")


# ── API Schemas ──────────────────────────────────────
class EventCreate(EventBase):
    pass


class EventRead(EventBase):
    id:            int
    created_at:    datetime
    created_by_id: Optional[int]


class EventUpdate(SQLModel):
    title:         Optional[str]         = None
    description:   Optional[str]         = None
    location:      Optional[str]         = None
    starts_at:     Optional[datetime]    = None
    ends_at:       Optional[datetime]    = None
    status:        Optional[EventStatus] = None
    max_attendees: Optional[int]         = None


# ── Attendance link table (Member ↔ Event) ───────────
class AttendanceStatus(str, Enum):
    going     = "going"
    not_going = "not_going"
    maybe     = "maybe"


class EventAttendance(SQLModel, table=True):
    id:            Optional[int]      = Field(default=None, primary_key=True)
    member_id:     int                = Field(foreign_key="member.id")
    event_id:      int                = Field(foreign_key="event.id")
    status:        AttendanceStatus   = Field(default=AttendanceStatus.going)
    registered_at: datetime           = Field(default_factory=datetime.utcnow)

    member: Optional[Member] = Relationship(back_populates="attendances")
    event:  Optional[Event]  = Relationship(back_populates="attendances")


class AttendanceCreate(SQLModel):
    event_id: int
    status:   AttendanceStatus = AttendanceStatus.going


class AttendanceRead(SQLModel):
    id:            int
    member_id:     int
    event_id:      int
    status:        AttendanceStatus
    registered_at: datetime


# ══════════════════════════════════════════════════════
#  POSTS TABLE
#  Blog content + interaction counts
# ══════════════════════════════════════════════════════

class PostBase(SQLModel):
    title:     str           = Field(index=True)
    content:   str                             # full blog body
    image_url: Optional[str] = None            # optional cover image
    is_published: bool       = Field(default=False)


class Post(PostBase, table=True):
    id:         Optional[int] = Field(default=None, primary_key=True)
    author_id:  Optional[int] = Field(default=None, foreign_key="member.id")
    created_at: datetime      = Field(default_factory=datetime.utcnow)
    updated_at: datetime      = Field(default_factory=datetime.utcnow)

    # Interaction counts (stored directly for fast reads)
    likes_count:    int = Field(default=0)
    comments_count: int = Field(default=0)
    views_count:    int = Field(default=0)

    author: Optional[Member] = Relationship(back_populates="posts")


# ── API Schemas ──────────────────────────────────────
class PostCreate(PostBase):
    pass


class PostRead(PostBase):
    id:             int
    author_id:      Optional[int]
    created_at:     datetime
    updated_at:     datetime
    likes_count:    int
    comments_count: int
    views_count:    int


class PostUpdate(SQLModel):
    title:        Optional[str]  = None
    content:      Optional[str]  = None
    image_url:    Optional[str]  = None
    is_published: Optional[bool] = None
