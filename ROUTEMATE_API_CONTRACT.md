# ROUTEMATE — API CONTRACT & CLIENT CROSS-CHECK DOCUMENTATION

**Date:** 2026-10-05  
**Scope:** Verification between FastAPI OpenAPI schemas and Flutter `ApiClient` models

---

## 1. Authentication Schemas

### Registration Request (`POST /api/v1/auth/register`)
- **Flutter Model:** `RegisterRequest` in `mobile/lib/core/network/api_client.dart`
- **FastAPI Schema:** `UserCreate` in `backend/app/schemas/user.py`
- **Fields:**
  - `email` (string, required)
  - `password` (string, required)
  - `role` (string: `"TRAVELLER"` | `"GUIDE"` | `"ADMIN"`, default: `"TRAVELLER"`)
  - `full_name` (string, required)
  - `phone` (string, optional)
  - `preferred_language` (string, optional)
  - `emergency_contact_name` (string, optional)
  - `emergency_contact_phone` (string, optional)
  - `specialty` (string, optional)
  - `years_experience` (int, optional)
  - `languages` (list[string], optional)

### Token Response (`POST /api/v1/auth/login`)
- **FastAPI Schema:** `Token` in `backend/app/schemas/user.py`
- **Fields:**
  - `access_token` (string)
  - `token_type` (string, default: `"bearer"`)
  - `user_id` (string)
  - `role` (string)
  - `expires_in` (int)

---

## 2. Request Lifecycle Schemas

### Guide Request Create (`POST /api/v1/requests/create`)
- **Fields:**
  - `guide_id` (string, required)
  - `origin_name` (string, required)
  - `destination_name` (string, required)
  - `distance_km` (float, optional)

### Guide Request Respond (`POST /api/v1/requests/{id}/respond`)
- **Fields:**
  - `action` (string: `"ACCEPT"` | `"DECLINE"`)
- **Response:**
  - `success` (bool)
  - `status` (string: `"ACCEPTED"` | `"DECLINE"` | `"EXPIRED"`)
  - `session_id` (string | null)

---

## 3. Real-Time Telemetry & WebSocket Schema

### Connection URL
- `ws://<host>/ws/sessions/{session_id}?token=<jwt_token>`

### Message Format
```json
{
  "id": "msg-12345",
  "type": "CHAT" | "LOCATION_UPDATE" | "SYSTEM" | "USER_JOINED" | "USER_LEFT",
  "text": "Hello Guide!",
  "sender_id": "usr-123",
  "sender_role": "TRAVELLER" | "GUIDE" | "SYSTEM",
  "latitude": 10.0889,
  "longitude": 77.0595
}
```

---

## 4. Android Network Configuration

- **Emulator Base Host:** `10.0.2.2:8000`
- **Physical Device Host:** Custom LAN IP (e.g. `192.168.x.x:8000`) selectable via in-app Server Settings UI (`AppConfig.saveCustomHost()`).
- **Android Cleartext:** `android:usesCleartextTraffic="true"` configured in `mobile/android/app/src/main/AndroidManifest.xml`.
