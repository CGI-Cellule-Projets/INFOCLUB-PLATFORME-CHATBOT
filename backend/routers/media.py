from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import shutil
import uuid
import os
from routers.auth import get_current_member, require_mod_or_head
from models.models import Member

router = APIRouter(prefix="/media", tags=["🖼️ Media"])

UPLOAD_DIR = "uploads"

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    _: Member = Depends(require_mod_or_head)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Le fichier doit être une image")

    # Generate unique filename
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save locally
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return the local URL
    return {"url": f"http://127.0.0.1:8000/uploads/{filename}"}
