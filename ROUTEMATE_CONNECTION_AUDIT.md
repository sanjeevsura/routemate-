# ROUTEMATE — CONNECTION & ARCHITECTURE AUDIT

**Date:** 2026-10-05  
**Scope:** Mobile (Flutter) ↔ Supabase Auth ↔ FastAPI ↔ Maps (OSRM/Photon) ↔ Drift DB  
**Status:** ✅ Fully Connected & Verified  

---

## 1. Authentication Connection Flow

```text
Flutter Mobile Client
   │
   ├── 1. Supabase Auth (Sign Up / Sign In)
   │      └─ Returns Supabase JWT & Session Token
   │
   ├── 2. ApiClient Interceptor
   │      └─ Attaches `Authorization: Bearer <Supabase JWT>`
   │
   └── 3. FastAPI Backend (`/api/v1/auth/profile`)
          ├─ Validates JWT with Supabase Public Key
          ├─ Resolves User Role (TRAVELLER / GUIDE / ADMIN)
          └─ Syncs User Profile in Database
```

- **Supabase Auth Target**: `ykqhdpybffwktezvvfyg`
- **FastAPI Base URL**: Configurable via `AppConfig.baseUrl` (`http://10.0.2.2:8000` on Android Emulator, `http://localhost:8000` on Web/Desktop)
- **Role Control**: Server-authoritative RBAC enforced on FastAPI endpoints (`@require_role("ADMIN")`, `@require_role("GUIDE")`).

---

## 2. Navigation, Routing & Maps Connection

1. **Geocoding & Location Search**:
   - Provider: Photon Geocoding API (`https://photon.komoot.io/api`)
   - Endpoint: `GET /api/v1/places/search?q=...`
   - Data Returned: Structured GeoJSON featuring place name, city, latitude, longitude.

2. **OSRM Route Generation**:
   - Provider: OSRM (Open Source Routing Machine) API (`http://router.project-osrm.org/route/v1/driving`)
   - Endpoint: `GET /api/v1/routes?start_lat=...&start_lon=...&end_lat=...&end_lon=...`
   - Output: Geometry polylines, total distance (km), estimated duration (mins).

3. **Nearby Travel Necessities (POI)**:
   - Provider: Real POI query engine (`GET /api/v1/places/nearby`)
   - Categories: Hospitals, Hotels, Restaurants, Pharmacies, Fuel Stations, Police Stations, ATMs, Shops, Vehicle Service.

---

## 3. Real-Time Chat & Session Gateway

- **Protocol**: WebSockets (`ws://10.0.2.2:8000/api/v1/ws/chat/{session_id}?token={jwt}`)
- **Features**:
  - Auto-reconnect handler with backoff.
  - Connection status badge (`Connected`, `Connecting`, `Disconnected`).
  - Bidirectional JSON message exchange (`{ "type": "chat", "content": "..." }`).

---

## 4. Offline Drift Database Synchronization

- **Engine**: Drift SQLite (`mobile/lib/core/database/app_database.dart`)
- **Tables**: `OfflineRoutes`, `OfflineMemories`, `UserPreferences`
- **Behavior**: Seamless read fallback when network is unavailable, background sync when connectivity resumes.
