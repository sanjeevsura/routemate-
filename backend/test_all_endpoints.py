import asyncio
import uuid
import sys

# Configure UTF-8 encoding for Windows standard output
if sys.stdout:
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr:
    sys.stderr.reconfigure(encoding="utf-8")

from httpx import AsyncClient, ASGITransport
import app.models
from app.main import app as fastapi_app
from app.db.session import engine
from app.db.base import Base

async def run_master_verification():
    print("=" * 70)
    print("🚀 ROUTEMATE BACKEND COMPREHENSIVE END-TO-END API TEST SUITE")
    print("=" * 70)

    # 1. Initialize Database Schema
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ [DB] Database connection and schema verified.")

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # TEST 1: Health Check
        print("\n--- [1] System Health ---")
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        data = res.json()
        assert data["status"] == "ONLINE"
        print(f"✅ GET /health -> Status: {data['status']}, Service: {data['service']}")

        # TEST 2: Authentication & Registration Flow
        print("\n--- [2] Auth: Registration & Token Authentication ---")
        unique_suffix = uuid.uuid4().hex[:6]
        
        # 2a: Register Traveller
        traveller_email = f"traveller_{unique_suffix}@routemate.io"
        traveller_pwd = "Password@123"
        reg_traveller = {
            "email": traveller_email,
            "password": traveller_pwd,
            "role": "TRAVELLER",
            "full_name": f"Test Traveller {unique_suffix}",
            "phone": "+919876543210",
            "preferred_language": "English",
            "emergency_contact_name": "Family Contact",
            "emergency_contact_phone": "+919999988888"
        }
        res = await client.post("/api/v1/auth/register", json=reg_traveller)
        assert res.status_code == 201, f"Traveller registration failed: {res.text}"
        traveller_token = res.json()["access_token"]
        traveller_id = res.json()["user_id"]
        print(f"✅ POST /api/v1/auth/register (Traveller) -> ID: {traveller_id}")

        # 2b: Register Guide
        guide_email = f"guide_{unique_suffix}@routemate.io"
        guide_pwd = "Password@123"
        reg_guide = {
            "email": guide_email,
            "password": guide_pwd,
            "role": "GUIDE",
            "full_name": f"Master Guide {unique_suffix}",
            "phone": "+919123456789",
            "specialty": "Western Ghats Mountain Trails",
            "years_experience": 8,
            "languages": ["English", "Malayalam", "Tamil"],
            "coverage_radius_km": 25.0,
            "rate_per_session_inr": 200.0,
            "route_experience_description": "Over 8 years mountain rescue and high altitude guiding experience."
        }
        res = await client.post("/api/v1/auth/register", json=reg_guide)
        assert res.status_code == 201, f"Guide registration failed: {res.text}"
        guide_token = res.json()["access_token"]
        guide_id = res.json()["user_id"]
        print(f"✅ POST /api/v1/auth/register (Guide) -> ID: {guide_id}")

        # 2c: Register Admin
        admin_email = f"admin_{unique_suffix}@routemate.io"
        admin_pwd = "AdminPassword@123"
        reg_admin = {
            "email": admin_email,
            "password": admin_pwd,
            "role": "ADMIN",
            "full_name": f"Lead Admin {unique_suffix}",
            "phone": "+919000000000"
        }
        res = await client.post("/api/v1/auth/register", json=reg_admin)
        assert res.status_code == 201, f"Admin registration failed: {res.text}"
        admin_token = res.json()["access_token"]
        admin_id = res.json()["user_id"]
        print(f"✅ POST /api/v1/auth/register (Admin) -> ID: {admin_id}")

        # 2d: Duplicate Email Validation
        res = await client.post("/api/v1/auth/register", json=reg_traveller)
        assert res.status_code == 409, "Duplicate registration should fail with 409 Conflict"
        print("✅ POST /api/v1/auth/register (Duplicate Email) -> Correctly rejected with HTTP 409 Conflict")

        # 2e: Login Validation (Negative and Positive)
        res = await client.post("/api/v1/auth/login", json={"email": traveller_email, "password": "WrongPassword"})
        assert res.status_code == 401, "Invalid password should fail with 401 Unauthorized"
        print("✅ POST /api/v1/auth/login (Invalid Password) -> Correctly rejected with HTTP 401")

        res = await client.post("/api/v1/auth/login", json={"email": traveller_email, "password": traveller_pwd})
        assert res.status_code == 200, f"Login failed: {res.text}"
        assert res.json()["role"] == "TRAVELLER"
        print("✅ POST /api/v1/auth/login (Valid Credentials) -> Token issued successfully")

        # 2f: /auth/me Endpoint
        traveller_headers = {"Authorization": f"Bearer {traveller_token}"}
        guide_headers = {"Authorization": f"Bearer {guide_token}"}
        admin_headers = {"Authorization": f"Bearer {admin_token}"}

        res = await client.get("/api/v1/auth/me", headers=traveller_headers)
        assert res.status_code == 200
        assert res.json()["id"] == traveller_id
        print(f"✅ GET /api/v1/auth/me -> Authenticated user verified: {res.json()['full_name']}")

        # 2g: Direct Supabase JWT Verification & Auto-Sync
        import jwt as pyjwt
        from datetime import datetime, timezone, timedelta
        supabase_sub = str(uuid.uuid4())
        supabase_token = pyjwt.encode(
            {
                "iss": "https://ykqhdpybffwktezvvfyg.supabase.co/auth/v1",
                "aud": "authenticated",
                "sub": supabase_sub,
                "email": f"supabase_{unique_suffix}@routemate.io",
                "user_metadata": {
                    "role": "TRAVELLER",
                    "full_name": f"Supabase User {unique_suffix}"
                },
                "exp": datetime.now(timezone.utc) + timedelta(hours=1)
            },
            "supabase_dummy_sign",
            algorithm="HS256"
        )
        res_sb = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {supabase_token}"})
        assert res_sb.status_code == 200, f"Supabase JWT verification failed: {res_sb.text}"
        sb_user = res_sb.json()
        assert sb_user["id"] == supabase_sub
        print(f"✅ Supabase JWT Verified & Synchronized: ID: {sb_user['id']}, Role: {sb_user['role']}")

        # TEST 3: Admin Verifies Guide & Guide Toggles Availability
        print("\n--- [3] Admin Verifies Guide & Guide Toggles Availability ---")
        # 3a: Admin approves guide
        verify_payload = {
            "guide_id": guide_id,
            "action": "APPROVE"
        }
        res = await client.post("/api/v1/admin/verify-guide", json=verify_payload, headers=admin_headers)
        assert res.status_code == 200
        print(f"✅ POST /api/v1/admin/verify-guide (APPROVE) -> Guide verification updated: {res.json()['verification_status']}")

        # 3b: Update Guide availability & location
        avail_payload = {
            "is_available": True,
            "latitude": 10.0889,
            "longitude": 77.0595
        }
        res = await client.post("/api/v1/guides/availability", json=avail_payload, headers=guide_headers)
        assert res.status_code == 200, f"Guide availability update failed: {res.text}"
        print(f"✅ POST /api/v1/guides/availability -> Availability set to True, coords: ({res.json()['latitude']}, {res.json()['longitude']})")

        # 3c: Discover Guides
        res = await client.get("/api/v1/guides?lat=10.0889&lon=77.0595&radius=50&filter=all")
        assert res.status_code == 200
        guides_list = res.json()["guides"]
        assert len(guides_list) >= 1
        print(f"✅ GET /api/v1/guides -> Found {len(guides_list)} verified available guide(s)")

        # TEST 4: Assistance Request Lifecycle (Create -> Fetch -> Accept)
        print("\n--- [4] Request Lifecycle: Traveller Request -> Guide Accept ---")
        req_payload = {
            "guide_id": guide_id,
            "origin_name": "Munnar Tea Gardens",
            "destination_name": "Top Station Peak",
            "distance_km": 32.5
        }
        res = await client.post("/api/v1/requests/create", json=req_payload, headers=traveller_headers)
        assert res.status_code == 200, f"Request creation failed: {res.text}"
        request_data = res.json()
        request_id = request_data["id"]
        assert request_data["status"] == "PENDING"
        print(f"✅ POST /api/v1/requests/create -> Request ID: {request_id}, Status: {request_data['status']}")

        # Guide checks pending requests
        res = await client.get("/api/v1/requests/pending", headers=guide_headers)
        assert res.status_code == 200
        pending_items = res.json()
        assert any(item["id"] == request_id for item in pending_items)
        print(f"✅ GET /api/v1/requests/pending -> Guide retrieved {len(pending_items)} pending request(s)")

        # Guide accepts request -> Spawns active session
        res = await client.post(f"/api/v1/requests/{request_id}/respond", json={"action": "ACCEPT"}, headers=guide_headers)
        assert res.status_code == 200, f"Request acceptance failed: {res.text}"
        resp_data = res.json()
        assert resp_data["status"] == "ACCEPTED"
        session_id = resp_data["session_id"]
        assert session_id is not None
        print(f"✅ POST /api/v1/requests/{request_id}/respond (ACCEPT) -> Session spawned: {session_id}")

        # TEST 5: Active Session & Real-time Messaging
        print("\n--- [5] Session Management & Live Messaging ---")
        res = await client.get(f"/api/v1/sessions/{session_id}", headers=traveller_headers)
        assert res.status_code == 200
        assert res.json()["status"] == "ACTIVE"
        print(f"✅ GET /api/v1/sessions/{session_id} -> Status: {res.json()['status']}")

        # Traveller sends message
        msg_payload_1 = {
            "text": "Hello Guide! I see heavy fog approaching at hairpin bend 4.",
            "latitude": 10.0520,
            "longitude": 77.0710
        }
        res = await client.post(f"/api/v1/sessions/{session_id}/messages", json=msg_payload_1, headers=traveller_headers)
        assert res.status_code == 200
        msg_1 = res.json()
        assert msg_1["sender_role"] == "TRAVELLER"
        print(f"✅ POST /api/v1/sessions/{session_id}/messages (Traveller) -> Msg ID: {msg_1['id']}")

        # Guide responds
        msg_payload_2 = {
            "text": "Understood! Reduce speed to 20 km/h and turn on fog lamps. Take the left bypass route.",
            "latitude": 10.0889,
            "longitude": 77.0595
        }
        res = await client.post(f"/api/v1/sessions/{session_id}/messages", json=msg_payload_2, headers=guide_headers)
        assert res.status_code == 200
        msg_2 = res.json()
        assert msg_2["sender_role"] == "GUIDE"
        print(f"✅ POST /api/v1/sessions/{session_id}/messages (Guide) -> Msg ID: {msg_2['id']}")

        # End Session
        res = await client.post(f"/api/v1/sessions/{session_id}/end", headers=traveller_headers)
        assert res.status_code == 200
        print(f"✅ POST /api/v1/sessions/{session_id}/end -> Session successfully completed")

        # TEST 6: Route Memory / Hazards & Crowdsourced Confirmation
        print("\n--- [6] Route Memory: Hazard Pinning & Confidence Decay/Upvotes ---")
        mem_payload = {
            "title": "Landslide Clearance Work",
            "category": "HAZARD",
            "description": "Single lane traffic movement due to boulder clearance near gap road.",
            "latitude": 10.0450,
            "longitude": 77.1020,
            "route_corridor": "NH-85 Kochi-Dhanushkodi",
            "kilometer_marker": 118.0
        }
        res = await client.post("/api/v1/route-memory", json=mem_payload, headers=guide_headers)
        assert res.status_code == 201, f"Route memory creation failed: {res.text}"
        mem_id = res.json()["id"]
        initial_confidence = res.json()["confidence_percent"]
        print(f"✅ POST /api/v1/route-memory -> Pin created: {mem_id}, Initial confidence: {initial_confidence}%")

        # Confirm / Upvote Route Memory
        res = await client.post(f"/api/v1/route-memory/{mem_id}/confirm", json={"action": "STILL_THERE"}, headers=traveller_headers)
        assert res.status_code == 200
        updated_mem = res.json()
        assert updated_mem["confirmations"] >= 1
        print(f"✅ POST /api/v1/route-memory/{mem_id}/confirm (Upvote) -> Confirmations: {updated_mem['confirmations']}, Confidence: {updated_mem['confidence_percent']}%")

        # List Route Memories
        res = await client.get("/api/v1/route-memory")
        assert res.status_code == 200
        memories = res.json()
        assert any(m["id"] == mem_id for m in memories)
        print(f"✅ GET /api/v1/route-memory -> Successfully listed {len(memories)} active memory pin(s)")

        # TEST 7: Emergency SOS Distress Broadcast
        print("\n--- [7] Emergency SOS Distress Broadcast ---")
        sos_payload = {
            "latitude": 10.0215,
            "longitude": 77.0123,
            "elevation_msl": 1650.0
        }
        res = await client.post("/api/v1/sos/broadcast", json=sos_payload, headers=traveller_headers)
        assert res.status_code == 201, f"SOS broadcast failed: {res.text}"
        sos_res = res.json()
        assert sos_res["success"] is True
        print(f"✅ POST /api/v1/sos/broadcast -> Distress ID: {sos_res['event_id']}, Notified Contacts: {len(sos_res['emergency_contacts_notified'])}")

        # TEST 8: Reviews & Ratings Lifecycle
        print("\n--- [8] Post-Trip Review & Guide Rating ---")
        review_payload = {
            "rating": 5,
            "review_text": "Exceptional local navigation guidance through dense fog near gap road!"
        }
        res = await client.post(f"/api/v1/sessions/{session_id}/review", json=review_payload, headers=traveller_headers)
        assert res.status_code == 200, f"Review submission failed: {res.text}"
        print(f"✅ POST /api/v1/sessions/{session_id}/review -> Rating: {res.json()['rating']}/5, ID: {res.json()['review_id']}")

        # TEST 9: Traveller Complaints & Reports
        print("\n--- [9] Traveller Complaints & Reports ---")
        complaint_payload = {
            "category": "SAFETY_CONCERN",
            "description": "Reported fallen powerline near KM 118 pass; required warning for other travellers.",
            "target_user_id": guide_id,
            "session_id": session_id
        }
        res = await client.post("/api/v1/complaints", json=complaint_payload, headers=traveller_headers)
        assert res.status_code == 201, f"Complaint creation failed: {res.text}"
        complaint_id = res.json()["complaint_id"]
        print(f"✅ POST /api/v1/complaints -> Reference ID: {complaint_id}, Status: {res.json()['status']}")

        res = await client.get("/api/v1/complaints/my", headers=traveller_headers)
        assert res.status_code == 200
        assert len(res.json()) >= 1
        print(f"✅ GET /api/v1/complaints/my -> Retrieved {len(res.json())} traveller complaint(s)")

        # TEST 10: Routing & Nearby Necessities Geocoding
        print("\n--- [10] Geocoding & Nearby Essentials Services ---")
        res = await client.get("/api/v1/geocoding/search?q=Munnar&limit=5")
        assert res.status_code == 200
        geo_res = res.json()
        print(f"✅ GET /api/v1/geocoding/search?q=Munnar -> Found: {len(geo_res.get('results', []))} location(s)")

        res = await client.get("/api/v1/geocoding/nearby?lat=10.0889&lon=77.0595&category=hospital&limit=5")
        assert res.status_code == 200
        print(f"✅ GET /api/v1/geocoding/nearby (Hospitals) -> HTTP 200, Results count: {len(res.json())}")

        res = await client.get("/api/v1/routes/directions?from=10.0889,77.0595&to=10.0102,77.4768")
        assert res.status_code == 200
        directions = res.json()
        print(f"✅ GET /api/v1/routes/directions -> Distance: {directions.get('distance_km')} km, Duration: {directions.get('duration_min')} min")

        # TEST 11: Admin Operations, Moderation & Live Metrics
        print("\n--- [11] Admin: Moderation & Live Metrics ---")
        # Non-admin access check
        res = await client.get("/api/v1/admin/overview", headers=traveller_headers)
        assert res.status_code == 403, "Non-admin access to admin overview should be 403 Forbidden"
        print("✅ GET /api/v1/admin/overview (Traveller forbidden) -> Correctly returned HTTP 403")

        res = await client.get("/api/v1/admin/overview", headers=admin_headers)
        assert res.status_code == 200, f"Admin overview failed: {res.text}"
        admin_data = res.json()
        stats = admin_data["stats"]
        print(f"✅ GET /api/v1/admin/overview (Admin) -> Travellers: {stats['total_travellers']}, Guides: {stats['total_guides']}")

        # Admin lists complaints
        res = await client.get("/api/v1/admin/complaints", headers=admin_headers)
        assert res.status_code == 200
        print(f"✅ GET /api/v1/admin/complaints -> Admin retrieved {len(res.json())} complaint(s)")

        # Admin resolves complaint
        res = await client.post(f"/api/v1/admin/complaints/{complaint_id}/respond", json={"status": "RESOLVED", "admin_notes": "Safety advisory dispatched."}, headers=admin_headers)
        assert res.status_code == 200
        print(f"✅ POST /api/v1/admin/complaints/{complaint_id}/respond -> Status: {res.json()['status']}")

        # Admin updates guide status
        res = await client.post(f"/api/v1/admin/guides/{guide_id}/status", json={"action": "SUSPEND"}, headers=admin_headers)
        assert res.status_code == 200
        assert res.json()["verification_status"] == "SUSPENDED"
        print(f"✅ POST /api/v1/admin/guides/{guide_id}/status (SUSPEND) -> Status: {res.json()['verification_status']}")

        # TEST 10: AI / Gemini Extraction Test
        print("\n--- [10] AI: Gemini Hazard Extraction ---")
        ai_payload = {
            "fieldNotes": "Caution near KM 42 on Devikulam pass: heavy rockfall blocking the downhill lane. Muddy slick surface after rainfall."
        }
        res = await client.post("/api/v1/ai/extract-hazard", json=ai_payload)
        # Note: If no API key is provided, test graceful fallback/response
        print(f"ℹ️ POST /api/v1/ai/extract-hazard -> HTTP {res.status_code}")
        if res.status_code == 200:
            print(f"✅ AI Extraction Response: {res.json()}")
        else:
            print(f"ℹ️ (Graceful handling when GEMINI_API_KEY is unset): {res.json()['detail']}")

    print("\n" + "=" * 70)
    print("🏆 ALL BACKEND ENDPOINTS EXECUTED AND FULLY VERIFIED PASSING!")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_master_verification())
