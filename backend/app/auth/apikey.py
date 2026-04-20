import secrets
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from ..config import settings
import os
from pathlib import Path

def get_or_create_api_key() -> str:
    if settings.api_key:
        return settings.api_key
    
    env_path = Path(".env")
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                if line.startswith("API_KEY="):
                    return line.strip().split("=")[1]
    
    new_key = secrets.token_hex(32)
    with open(env_path, "a") as f:
        f.write(f"\nAPI_KEY={new_key}\n")
    print(f"\n[auth] Generated new API_KEY. Written to .env\n[auth] API_KEY={new_key}\n")
    settings.api_key = new_key
    return new_key

class APIKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client_host = request.client.host if request.client else None
        
        # Localhost does not require API key
        if client_host in ("127.0.0.1", "::1", "localhost"):
            return await call_next(request)
        
        api_key_header = request.headers.get("X-API-Key")
        if not api_key_header or api_key_header != get_or_create_api_key():
            return JSONResponse(
                status_code=403,
                content={"detail": "Invalid or missing API key"}
            )
            
        return await call_next(request)
