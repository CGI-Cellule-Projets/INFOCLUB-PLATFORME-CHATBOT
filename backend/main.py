from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from fastapi.staticfiles import StaticFiles
import os

from core.database import create_db_and_tables
from routers import auth, members, events, posts, chatbot, media


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Runs once at startup — creates all MySQL tables if they don't exist
    create_db_and_tables()
    yield


app = FastAPI(
    title="🎓 University Club API",
    description="Backend for the university student club — Members, Events, Posts.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. Change to specific origins in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images locally
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Serve frontend files
frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/site", StaticFiles(directory=frontend_path, html=True), name="site")

# Register all routers
app.include_router(auth.router)
app.include_router(members.router)
app.include_router(events.router)
app.include_router(posts.router)
app.include_router(chatbot.router)
app.include_router(media.router)


@app.get("/", tags=["Root"])
def root():
    return {"message": "Welcome to the Club API 🎓 — visit /docs for the full API"}
