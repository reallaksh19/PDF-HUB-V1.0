from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config import settings
from .auth.apikey import APIKeyMiddleware, get_or_create_api_key
from .api import ping, files, pages, annotations
from storage.annotation_db import init_db
import storage.file_store as file_store

@asynccontextmanager
async def lifespan(app: FastAPI):
    get_or_create_api_key()
    await file_store.cleanup_expired()
    await init_db()
    yield

app = FastAPI(
    title="DocCraft API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(APIKeyMiddleware)

app.include_router(ping.router)
app.include_router(files.router)
app.include_router(pages.router)
app.include_router(annotations.router)
