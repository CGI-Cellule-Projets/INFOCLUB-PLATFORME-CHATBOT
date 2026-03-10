from fastapi import FastAPI
from contextlib import asynccontextmanager

from core.database import create_db_and_tables
from routers import auth, members, events, posts


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

# Register all routers
app.include_router(auth.router)
app.include_router(members.router)
app.include_router(events.router)
app.include_router(posts.router)


@app.get("/", tags=["Root"])
def root():
    return {"message": "Welcome to the Club API 🎓 — visit /docs for the full API"}
