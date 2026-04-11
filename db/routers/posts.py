from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from core.database import get_session
from core.memory import add_blog_to_memory
from models.models import Post, PostCreate, PostRead, PostUpdate, Member
from routers.auth import get_current_member, require_head, require_mod_or_head

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
    
    # Write one extra line of code inside that route to trigger your add_blog_to_memory() function
    add_blog_to_memory(post.title, post.content)
    
    return post


@router.get("/", response_model=List[PostRead], summary="List all published posts")
def list_posts(session: Session = Depends(get_session),
               _: Member = Depends(get_current_member)):
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
    current: Member = Depends(get_current_member),
):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    if not post.is_published and current.role == "cell":
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


@router.post("/{post_id}/like", summary="Like a post")
def like_post(post_id: int, session: Session = Depends(get_session),
              _: Member = Depends(get_current_member)):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    post.likes_count += 1
    session.add(post)
    session.commit()
    return {"likes_count": post.likes_count}


@router.delete("/{post_id}", status_code=204,
               summary="Delete a post permanently — Head only")
def delete_post(post_id: int, session: Session = Depends(get_session),
                _: Member = Depends(require_head)):   # ← only Heads can delete
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(404, "Post not found")
    session.delete(post)
    session.commit()
