import asyncio
import httpx
import json

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def test_backend():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        print("1. Testing Health Endpoint...")
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("   -> Health OK:", res.json())

        print("2. Testing Geocoding Search (Photon API fallback/proxy)...")
        res = await client.get("/geocoding/search?q=Chennai")
        assert res.status_code == 200, f"Geocoding failed: {res.text}"
        print(f"   -> Geocoding OK (found {len(res.json().get('results', []))} results)")

        print("3. Testing OSRM Route Directions...")
        res = await client.get("/routes/directions?from=13.0827,80.2707&to=13.0400,80.2400")
        assert res.status_code == 200, f"Route directions failed: {res.text}"
        print("   -> Route Directions OK:", res.json().get("summary", {}))

        print("4. Testing User Registration (Traveller)...")
        traveller_email = f"traveller_{asyncio.get_event_loop().time():.0f}@example.com"
        res = await client.post("/auth/register", json={
            "email": traveller_email,
            "password": "Password123!",
            "full_name": "Test Traveller",
            "role": "TRAVELLER",
            "phone": "+919876543210",
            "emergency_contact_name": "Family",
            "emergency_contact_phone": "+919876543211",
            "preferred_language": "English"
        })
        assert res.status_code == 201, f"Traveller registration failed: {res.text}"
        t_data = res.json()
        traveller_token = t_data["access_token"]
        traveller_id = t_data["user_id"]
        print(f"   -> Traveller registered successfully (ID: {traveller_id})")

        print("5. Testing User Registration (Guide)...")
        guide_email = f"guide_{asyncio.get_event_loop().time():.0f}@example.com"
        res = await client.post("/auth/register", json={
            "email": guide_email,
            "password": "Password123!",
            "full_name": "Local Pro Guide",
            "role": "GUIDE",
            "phone": "+919123456780",
            "specialty": "Heritage & Mountain Trails",
            "years_experience": 5,
            "coverage_radius_km": 20.0,
            "rate_per_session_inr": 200.0,
            "languages": ["English", "Tamil"]
        })
        assert res.status_code == 201, f"Guide registration failed: {res.text}"
        g_data = res.json()
        guide_token = g_data["access_token"]
        guide_id = g_data["user_id"]
        print(f"   -> Guide registered successfully (ID: {guide_id})")

        print("6. Testing /auth/me for Traveller & Guide...")
        t_me = await client.get("/auth/me", headers={"Authorization": f"Bearer {traveller_token}"})
        assert t_me.status_code == 200, f"/auth/me traveller failed: {t_me.text}"
        g_me = await client.get("/auth/me", headers={"Authorization": f"Bearer {guide_token}"})
        assert g_me.status_code == 200, f"/auth/me guide failed: {g_me.text}"
        print("   -> Auth /me OK for both roles")

        print("7. Testing Guide Availability Update...")
        avail = await client.post("/guides/availability", 
            headers={"Authorization": f"Bearer {guide_token}"},
            json={"is_available": True, "latitude": 13.0827, "longitude": 80.2707}
        )
        assert avail.status_code == 200, f"Guide availability update failed: {avail.text}"
        print("   -> Guide availability set to Active")

        print("8. Testing Guide Search / Listing...")
        guides_res = await client.get("/guides?lat=13.0827&lon=80.2707&radius=30")
        assert guides_res.status_code == 200, f"Guides query failed: {guides_res.text}"
        print(f"   -> Guides found: {len(guides_res.json().get('guides', []))}")

        print("9. Testing Guide Request Creation & 30s TTL...")
        req_res = await client.post("/requests/create",
            headers={"Authorization": f"Bearer {traveller_token}"},
            json={
                "guide_id": guide_id,
                "origin_name": "Central Station",
                "destination_name": "Marina Beach",
                "distance_km": 4.5
            }
        )
        assert req_res.status_code in (200, 201), f"Request creation failed: {req_res.text}"
        request_id = req_res.json()["id"]
        print(f"   -> Guide Request created (ID: {request_id})")

        print("10. Testing Guide Request Accept...")
        accept_res = await client.post(f"/requests/{request_id}/respond",
            headers={"Authorization": f"Bearer {guide_token}"},
            json={"action": "ACCEPT"}
        )
        assert accept_res.status_code == 200, f"Guide accept failed: {accept_res.text}"
        session_id = accept_res.json()["session_id"]
        print(f"   -> Request accepted, Session created (ID: {session_id})")

        print("11. Testing Active Session Messaging...")
        msg_res = await client.post(f"/sessions/{session_id}/messages",
            headers={"Authorization": f"Bearer {traveller_token}"},
            json={"text": "Hello guide, starting route now!", "latitude": 13.0827, "longitude": 80.2707}
        )
        assert msg_res.status_code == 200, f"Session message failed: {msg_res.text}"
        print("   -> Message sent & recorded in session")

        print("12. Testing Session Completion & Review Submission...")
        end_res = await client.post(f"/sessions/{session_id}/end",
            headers={"Authorization": f"Bearer {traveller_token}"}
        )
        assert end_res.status_code == 200, f"Session end failed: {end_res.text}"
        
        rev_res = await client.post(f"/sessions/{session_id}/review",
            headers={"Authorization": f"Bearer {traveller_token}"},
            json={"rating": 5, "review_text": "Super helpful local guide, perfect assistance!"}
        )
        assert rev_res.status_code == 200, f"Review submission failed: {rev_res.text}"
        print("   -> Session ended and 5-Star Review submitted successfully")

        print("13. Testing Safety Complaint Filing...")
        cmp_res = await client.post("/complaints",
            headers={"Authorization": f"Bearer {traveller_token}"},
            json={
                "category": "OTHER",
                "description": "Road closure near milestone 4, please update offline trail note",
                "session_id": session_id
            }
        )
        assert cmp_res.status_code == 201, f"Complaint submission failed: {cmp_res.text}"
        print("   -> Complaint filed successfully (ID:", cmp_res.json()["complaint_id"], ")")

        print("14. Testing Route Memory Creation & Retrieval...")
        rm_res = await client.post("/route-memory",
            headers={"Authorization": f"Bearer {traveller_token}"},
            json={
                "title": "Steep rocky incline near pass",
                "category": "HAZARD",
                "description": "Loose gravel following rainfall, slow down",
                "latitude": 13.0850,
                "longitude": 80.2750,
                "route_corridor": "Marina Corridor"
            }
        )
        assert rm_res.status_code == 201, f"Route memory failed: {rm_res.text}"
        print("   -> Route memory created with baseline confidence")

        print("15. Testing Emergency SOS Broadcast...")
        sos_res = await client.post("/sos/broadcast",
            headers={"Authorization": f"Bearer {traveller_token}"},
            json={"latitude": 13.0827, "longitude": 80.2707, "elevation_msl": 12.5}
        )
        assert sos_res.status_code in (200, 201), f"SOS broadcast failed: {sos_res.text}"
        print("   -> Emergency SOS broadcast triggered and logged")

        print("\n==========================================")
        print(">>> ALL 15 BACKEND E2E TEST FLOWS PASSED! <<<")
        print("==========================================")

if __name__ == "__main__":
    asyncio.run(test_backend())
