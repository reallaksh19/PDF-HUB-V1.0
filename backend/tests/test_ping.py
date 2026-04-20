import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_ping():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/ping")
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "mode": "server",
        "version": "0.1.0"
    }

@pytest.mark.asyncio
async def test_capabilities():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/capabilities")
    assert response.status_code == 200
    assert response.json()["mode"] == "server"
    assert response.json()["canRunServerOcr"] is True
