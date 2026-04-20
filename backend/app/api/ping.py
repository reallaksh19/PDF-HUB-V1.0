from fastapi import APIRouter
from ..domain.models import PingResponse, ServerCapabilities

router = APIRouter()

@router.get("/api/ping", response_model=PingResponse)
async def ping():
    return PingResponse(
        status="ok",
        mode="server",
        version="0.1.0"
    )

@router.get("/api/capabilities", response_model=ServerCapabilities)
async def get_capabilities():
    return ServerCapabilities(
        mode="server",
        canOpenLocalFile=True,
        canMergeFiles=True,
        canSplitFile=True,
        canRunPreviewOcr=False,
        canRunServerOcr=True,
        canRunMacroApi=True,
        serverVersion="0.1.0"
    )
