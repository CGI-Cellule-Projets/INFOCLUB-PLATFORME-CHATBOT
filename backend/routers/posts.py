from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List, Optional

from core.database import get_session
from core.memory import sync_with_chatbot
from models.models import Post, PostCreate, PostRead, PostUpdate, Member, PostLike
from routers.auth import get_current_member, require_head, require_mod_or_head, get_current_member_optional

router = APIRouter(prefix="/blogs", tags=["📝 Blogs"])


@router.post("/", response_model=PostRead, status_code=201,
             summary="Create a blog post — Mod or Head")
def create_post(
    data: PostCreate,
    session: Session = Depends(get_session),
    current: Member = Depends(require_mod_or_head),
):
    post = Post(**data.model_dump(), author_id=current.id)
    session.add(post)
    session.commit()
    session.refresh(post)
    
    # Sync with chatbot memory
    sync_with_chatbot(post.title, post.content, category="news")
    
    return post


@router.get("/", response_model=List[PostRead], summary="List all published posts")
def list_posts(session: Session = Depends(get_session)):
    return session.exec(select(Post).where(Post.is_published == True)).all()


@router.get("/all", response_model=List[PostRead],
             summary="List ALL posts including drafts — Mod or Head only")
def list_all_posts(session: Session = Depends(get_session),
                   _: Member = Depends(require_mod_or_head)):
    return session.exec(select(Post)).all()


@router.get("/{post_id}", response_model=PostRead)
def get_post(
    post_id: int,
    session: Session = Depends(get_session),
    current: Optional[Member] = Depends(get_current_member_optional),
):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    if not post.is_published:
        if not current or current.role == "cell":
            raise HTTPException(403, "This post is not published yet")
    post.views_count += 1
    session.add(post)
    session.commit()
    session.refresh(post)
    return post


@router.patch("/{post_id}", response_model=PostRead,
              summary="Edit a post — Mod or Head")
def update_post(
    post_id: int,
    updates: PostUpdate,
    session: Session = Depends(get_session),
    _: Member = Depends(require_mod_or_head),
):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(post, field, value)
    post.updated_at = datetime.utcnow()
    session.add(post)
    session.commit()
    session.refresh(post)
    return post




@router.post("/{post_id}/like", summary="Like/Unlike a post")
def like_post(post_id: int, session: Session = Depends(get_session),
              current: Member = Depends(get_current_member)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    
    # Check if already liked
    existing_like = session.exec(
        select(PostLike)
        .where(PostLike.post_id == post_id)
        .where(PostLike.member_id == current.id)
    ).first()

    if existing_like:
        # Unlike
        session.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
        action = "unliked"
    else:
        # Like
        new_like = PostLike(post_id=post_id, member_id=current.id)
        session.add(new_like)
        post.likes_count += 1
        action = "liked"
    
    session.add(post)
    session.commit()
    return {"likes_count": post.likes_count, "action": action}


@router.delete("/{post_id}", status_code=204,
               summary="Delete a post permanently — Head only")
def delete_post(post_id: int, session: Session = Depends(get_session),
                _: Member = Depends(require_head)):   # ← only Heads can delete
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    session.delete(post)
    session.commit()
