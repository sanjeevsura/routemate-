import asyncio
import uuid
import sys
from datetime import datetime, timezone, timedelta
import jwt as pyjwt
from httpx import AsyncClient, ASGITransport

# Set UTF-8 encoding
if sys.stdout:
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr:
    sys.stderr.reconfigure(encoding="utf-8")

import app.models
from app.main import app as fastapi_app
from app.db.session import engine
from app.db.base import Base

def generate_supabase_jwt(user_id: str, email: str, role: str, full_name: str, expired: bool = False) -> str:
    """Generates a standard Supabase Auth JWT with official claims."""
    now = datetime.now(timezone.utc)
    exp = (now - timedelta(hours=1)) if expired else (now + timedelta(hours=2))
    payload = {
        "iss": "https://ykqhdpybffwktezvvfyg.supabase.co/auth/v1",
        "aud": "authenticated",
        "sub": user_id,
        "email": email,
        "role": "authenticated",
        "user_metadata": {
            "full_name": full_name,
            "role": role,
            "phone": "+919876543210"
        },
        "app_metadata": {
            "provider": "email",
            "providers": ["email"]
        },
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp())
    }
    return pyjwt.encode(payload, "supabase_secret_key_mock", algorithm="HS256")


async def run_supabase_full_chain_verification():
    print("=" * 80)
    print("🛡️ ROUTEMATE — SUPABASE AUTH -> FASTAPI -> RBAC FULL END-TO-END VERIFICATION")
    print("=" * 80)

    # 1. Initialize Database Schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ [Database] PostgreSQL/SQLite schema tables verified.")

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Generate Supabase Users (UUIDs)
        traveller_uuid = str(uuid.uuid4())
        traveller_email = f"traveller_{uuid.uuid4().hex[:6]}@routemate.io"
        traveller_jwt = generate_supabase_jwt(traveller_uuid, traveller_email, "TRAVELLER", "Alice Traveller")

        guide_uuid = str(uuid.uuid4())
        guide_email = f"guide_{uuid.uuid4().hex[:6]}@routemate.io"
        guide_jwt = generate_supabase_jwt(guide_uuid, guide_email, "GUIDE", "Bob Certified Guide")

        admin_uuid = str(uuid.uuid4())
        admin_email = f"admin_{uuid.uuid4().hex[:6]}@routemate.io"
        admin_jwt = generate_supabase_jwt(admin_uuid, admin_email, "ADMIN", "Charlie Root Admin")

        other_uuid = str(uuid.uuid4())
        other_jwt = generate_supabase_jwt(other_uuid, f"other_{uuid.uuid4().hex[:6]}@routemate.io", "TRAVELLER", "Dave Stranger")

        t_headers = {"Authorization": f"Bearer {traveller_jwt}"}
        g_headers = {"Authorization": f"Bearer {guide_jwt}"}
        a_headers = {"Authorization": f"Bearer {admin_jwt}"}
        o_headers = {"Authorization": f"Bearer {other_jwt}"}

        print("\n--- [1] Supabase JWT Identity & Auto-Sync Verification ---")
        # 1a. Traveller
        res = await client.get("/api/v1/auth/me", headers=t_headers)
        assert res.status_code == 200, f"Traveller auth failed: {res.text}"
        assert res.json()["id"] == traveller_uuid
        assert res.json()["role"] == "TRAVELLER"
        print(f"✅ Supabase Traveller Auto-Provisioned: {res.json()['full_name']} (ID: {traveller_uuid})")

        # 1b. Guide
        res = await client.get("/api/v1/auth/me", headers=g_headers)
        assert res.status_code == 200, f"Guide auth failed: {res.text}"
        assert res.json()["id"] == guide_uuid
        assert res.json()["role"] == "GUIDE"
        print(f"✅ Supabase Guide Auto-Provisioned: {res.json()['full_name']} (ID: {guide_uuid})")

        # 1c. Admin
        res = await client.get("/api/v1/auth/me", headers=a_headers)
        assert res.status_code == 200, f"Admin auth failed: {res.text}"
        assert res.json()["id"] == admin_uuid
        assert res.json()["role"] == "ADMIN"
        print(f"✅ Supabase Admin Auto-Provisioned: {res.json()['full_name']} (ID: {admin_uuid})")

        print("\n--- [2] Security & Token Validation Negative Tests ---")
        # 2a. Missing Token -> 401
        res = await client.get("/api/v1/auth/me")
        assert res.status_code == 401
        print("✅ Missing Token -> Correctly rejected with HTTP 401")

        # 2b. Malformed Token -> 401
        res = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid_garbage_token"})
        assert res.status_code == 401
        print("✅ Malformed Token -> Correctly rejected with HTTP 401")

        # 2c. Expired Supabase Token -> 401
        expired_jwt = generate_supabase_jwt(str(uuid.uuid4()), "expired@routemate.io", "TRAVELLER", "Expired User", expired=True)
        res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {expired_jwt}"})
        assert res.status_code == 401
        print("✅ Expired Supabase Token -> Correctly rejected with HTTP 401")

        print("\n--- [3] Server-Authoritative RBAC (Role-Based Access Control) ---")
        # 3a. Non-Admin accessing Admin Endpoint -> 403
        res = await client.get("/api/v1/admin/overview", headers=t_headers)
        assert res.status_code == 403
        print("✅ Traveller accessing /admin/overview -> Correctly forbidden (HTTP 403)")

        res = await client.get("/api/v1/admin/overview", headers=g_headers)
        assert res.status_code == 403
        print("✅ Guide accessing /admin/overview -> Correctly forbidden (HTTP 403)")

        # 3b. Real Admin accessing Admin Endpoint -> 200
        res = await client.get("/api/v1/admin/overview", headers=a_headers)
        assert res.status_code == 200
        print(f"✅ Admin accessing /admin/overview -> Authorized (HTTP 200) | Live Users: {res.json()['stats']['total_travellers']} travellers, {res.json()['stats']['total_guides']} guides")

        # 3c. Admin Approves Guide
        res = await client.post("/api/v1/admin/verify-guide", json={"guide_id": guide_uuid, "action": "APPROVE"}, headers=a_headers)
        assert res.status_code == 200
        print("✅ Admin approved Guide credentials -> Status: VERIFIED")

        # 3d. Traveller attempting to set Guide Availability -> 403
        res = await client.post("/api/v1/guides/availability", json={"is_available": True, "latitude": 10.05, "longitude": 77.08}, headers=t_headers)
        assert res.status_code == 403
        print("✅ Traveller attempting Guide availability update -> Correctly forbidden (HTTP 403)")

        # 3e. Guide sets availability -> 200
        res = await client.post("/api/v1/guides/availability", json={"is_available": True, "latitude": 10.0889, "longitude": 77.0595}, headers=g_headers)
        assert res.status_code == 200
        print("✅ Guide set availability & GPS coordinates -> HTTP 200")

        print("\n--- [4] Assistance Request Lifecycle with Supabase Identity ---")
        # 4a. Traveller sends Guide Request
        req_res = await client.post(
            "/api/v1/requests/create",
            json={
                "guide_id": guide_uuid,
                "origin_name": "Munnar Tea Valley",
                "destination_name": "Anamudi Peak",
                "distance_km": 18.5
            },
            headers=t_headers
        )
        assert req_res.status_code == 200
        request_id = req_res.json()["id"]
        print(f"✅ Traveller created Guide Request: {request_id}")

        # 4b. Guide fetches Pending Requests
        pending_res = await client.get("/api/v1/requests/pending", headers=g_headers)
        assert pending_res.status_code == 200
        assert any(r["id"] == request_id for r in pending_res.json())
        print(f"✅ Guide received pending request in queue (HTTP 200)")

        # 4c. Unauthorized user tries to respond -> 403
        bad_resp = await client.post(f"/api/v1/requests/{request_id}/respond", json={"action": "ACCEPT"}, headers=t_headers)
        assert bad_resp.status_code == 403
        print("✅ Non-guide user attempting to respond to request -> Correctly forbidden (HTTP 403)")

        # 4d. Assigned Guide Accepts Request -> Creates Active Session
        accept_res = await client.post(f"/api/v1/requests/{request_id}/respond", json={"action": "ACCEPT"}, headers=g_headers)
        assert accept_res.status_code == 200
        session_id = accept_res.json()["session_id"]
        print(f"✅ Guide accepted request -> Active Assistance Session created: {session_id}")

        print("\n--- [5] Active Session Privacy & Multi-User Chat ---")
        # 5a. Non-participant user tries to read session -> 403
        res = await client.get(f"/api/v1/sessions/{session_id}", headers=o_headers)
        assert res.status_code == 403
        print("✅ Eavesdropping user attempting to access private session -> Correctly forbidden (HTTP 403)")

        # 5b. Traveller sends telemetry message
        msg_res1 = await client.post(
            f"/api/v1/sessions/{session_id}/messages",
            json={"text": "Heavy mist rolling in. Which trail marker should I follow?", "latitude": 10.051, "longitude": 77.062},
            headers=t_headers
        )
        assert msg_res1.status_code == 200
        print(f"✅ Traveller sent telemetry message -> ID: {msg_res1.json()['id']}")

        # 5c. Guide responds
        msg_res2 = await client.post(
            f"/api/v1/sessions/{session_id}/messages",
            json={"text": "Stay on the red trail markers on your left. Do not take the ravine path.", "latitude": 10.0889, "longitude": 77.0595},
            headers=g_headers
        )
        assert msg_res2.status_code == 200
        print(f"✅ Guide sent guidance response -> ID: {msg_res2.json()['id']}")

        # 5d. End session
        end_res = await client.post(f"/api/v1/sessions/{session_id}/end", headers=t_headers)
        assert end_res.status_code == 200
        print("✅ Session cleanly ended -> HTTP 200")

        print("\n--- [6] Route Memory & Hazard Pinning with Supabase Auth ---")
        mem_res = await client.post(
            "/api/v1/route-memory",
            json={
                "title": "Fallen Timber on Hairpin 8",
                "category": "HAZARD",
                "description": "Large pine tree blocking half the road.",
                "latitude": 10.062,
                "longitude": 77.078,
                "route_corridor": "Gap Road Route",
                "kilometer_marker": 42.0
            },
            headers=g_headers
        )
        assert mem_res.status_code == 201
        mem_id = mem_res.json()["id"]
        print(f"✅ Route Memory Hazard Created: {mem_id} (Reported by Supabase user: {mem_res.json()['reported_by_name']})")

        # Traveller confirms hazard
        conf_res = await client.post(f"/api/v1/route-memory/{mem_id}/confirm", json={"action": "STILL_THERE"}, headers=t_headers)
        assert conf_res.status_code == 200
        assert conf_res.json()["confirmations"] >= 1
        print(f"✅ Hazard confirmed by traveller -> Confidence: {conf_res.json()['confidence_percent']}%")

        print("\n--- [7] Emergency SOS Broadcast with Supabase Auth ---")
        sos_res = await client.post(
            "/api/v1/sos/broadcast",
            json={"latitude": 10.021, "longitude": 77.014, "elevation_msl": 1720.0},
            headers=t_headers
        )
        assert sos_res.status_code == 201
        print(f"✅ SOS Distress Event Broadcast: ID: {sos_res.json()['event_id']} (Status: {sos_res.json()['status']})")

    print("\n" + "=" * 80)
    print("🏆 FULL SUPABASE AUTH -> FASTAPI -> RBAC -> DATABASE VERIFICATION COMPLETED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_supabase_full_chain_verification())
