import pytest
import uuid
from httpx import AsyncClient, ASGITransport
import app.models
from app.main import app as fastapi_app
from app.db.session import engine
from app.db.base import Base

@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] in ["ONLINE", "DEGRADED"]
        assert "database" in data

@pytest.mark.asyncio
async def test_full_auth_and_session_flow():
    # Initialize DB
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        suffix = uuid.uuid4().hex[:6]
        
        # 1. Register Traveller
        res = await client.post("/api/v1/auth/register", json={
            "email": f"t_{suffix}@test.io",
            "password": "Password123!",
            "role": "TRAVELLER",
            "full_name": f"Traveller {suffix}"
        })
        assert res.status_code == 201
        t_token = res.json()["access_token"]
        t_headers = {"Authorization": f"Bearer {t_token}"}

        # 2. Register Guide
        res = await client.post("/api/v1/auth/register", json={
            "email": f"g_{suffix}@test.io",
            "password": "Password123!",
            "role": "GUIDE",
            "full_name": f"Guide {suffix}"
        })
        assert res.status_code == 201
        g_id = res.json()["user_id"]
        g_token = res.json()["access_token"]
        g_headers = {"Authorization": f"Bearer {g_token}"}

        # 3. Register Admin
        res = await client.post("/api/v1/auth/register", json={
            "email": f"a_{suffix}@test.io",
            "password": "Password123!",
            "role": "ADMIN",
            "full_name": f"Admin {suffix}"
        })
        assert res.status_code == 201
        a_token = res.json()["access_token"]
        a_headers = {"Authorization": f"Bearer {a_token}"}

        # 4. Admin approves guide
        res = await client.post("/api/v1/admin/verify-guide", json={"guide_id": g_id, "action": "APPROVE"}, headers=a_headers)
        assert res.status_code == 200

        # 5. Guide sets availability
        res = await client.post("/api/v1/guides/availability", json={"is_available": True, "latitude": 10.0, "longitude": 77.0}, headers=g_headers)
        assert res.status_code == 200

        # 6. Traveller discovers guide
        res = await client.get("/api/v1/guides?lat=10.0&lon=77.0&radius=50")
        assert res.status_code == 200
        guides = res.json()["guides"]
        assert len(guides) >= 1

        # 7. Traveller creates request
        res = await client.post("/api/v1/requests/create", json={"guide_id": g_id, "origin_name": "A", "destination_name": "B"}, headers=t_headers)
        assert res.status_code in (200, 201)
        req_id = res.json()["id"]

        # 8. Guide accepts request
        res = await client.post(f"/api/v1/requests/{req_id}/respond", json={"action": "ACCEPT"}, headers=g_headers)
        assert res.status_code == 200
        sess_id = res.json()["session_id"]
        assert sess_id is not None

        # 9. SOS Broadcast
        res = await client.post("/api/v1/sos/broadcast", json={"latitude": 10.0, "longitude": 77.0}, headers=t_headers)
        assert res.status_code == 201
        assert res.json()["success"] is True

        # 10. Geocoding & Route Directions
        res = await client.get("/api/v1/geocoding/search?q=Munnar")
        assert res.status_code == 200

        res = await client.get("/api/v1/routes/directions?from=10.0,77.0&to=10.1,77.1")
        assert res.status_code == 200
