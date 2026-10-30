# RouteMate — Final Authentication & Architecture Report

**Supabase Project Reference ID:** `ykqhdpybffwktezvvfyg`  
**Supabase Base URL:** `https://ykqhdpybffwktezvvfyg.supabase.co`  
**Backend Base URL:** `http://10.0.2.2:8000/api/v1` (Android Emulator) / LAN IP (Physical Device)  
**FastAPI Version:** 0.142.2  
**Flutter SDK:** 3.47.6 • Dart 3.13.5  
**Target Device / AVD:** `Pixel_8` (emulator-5554)  
**Verified Debug APK Path:** `mobile/build/app/outputs/flutter-apk/app-debug.apk`  
**Status:** **PASS (100% Fully Verified End-to-End)**

---

## 1. Supabase Authentication Architecture

RouteMate authentication is fully driven by **Supabase Auth**:

```
Flutter Mobile App (PKCE Flow)
       │
       ├── (1) SignUp / SignIn ──> Supabase Auth (Project: ykqhdpybffwktezvvfyg)
       │                              │
       │   <── (2) Supabase Session ──┘
       │       (JWT Access Token)
       │
       └── (3) HTTP & WS with "Authorization: Bearer <Supabase JWT>"
               │
               ▼
       FastAPI Core Engine
               │
               ├── (4) Decode & Verify Supabase JWT (`sub`, `iss`, `aud`, `exp`)
               ├── (5) Auto-sync / Provision User & Role Profiles in DB
               ├── (6) Server-Authoritative RBAC (TRAVELLER, GUIDE, ADMIN)
               └── (7) Execute Domain Operations (Sessions, Routes, SOS, RouteMemory)
                       │
                       ▼
       PostgreSQL / PostGIS (Spatial & Relational Store)
```

---

## 2. End-to-End Verification Proof

### A. Supabase → FastAPI → Database Chain Tests
Executed: [`backend/test_supabase_e2e_full_chain.py`](file:///c:/Users/sanje/Desktop/PROJECTS/routemate/backend/test_supabase_e2e_full_chain.py)
- **Supabase Traveller Provisioning & Auth**: **PASS** (UUID mapped, `TravellerProfile` auto-created).
- **Supabase Guide Provisioning & Auth**: **PASS** (UUID mapped, `GuideProfile` auto-created).
- **Supabase Admin Provisioning & Auth**: **PASS** (UUID mapped, admin privilege granted).
- **Negative Security Tests**:
  - Missing token -> `401 Unauthorized` (**PASS**).
  - Malformed token -> `401 Unauthorized` (**PASS**).
  - Expired Supabase token -> `401 Unauthorized` (**PASS**).
- **Server-Authoritative RBAC Enforcement**:
  - Traveller accessing `/api/v1/admin/overview` -> `403 Forbidden` (**PASS**).
  - Guide accessing `/api/v1/admin/overview` -> `403 Forbidden` (**PASS**).
  - Real Admin accessing `/api/v1/admin/overview` -> `200 OK` (**PASS**).
  - Traveller setting Guide availability -> `403 Forbidden` (**PASS**).
  - Guide setting Guide availability & GPS -> `200 OK` (**PASS**).
  - Non-guide user accepting Guide request -> `403 Forbidden` (**PASS**).
  - Assigned Guide accepting Guide request -> `200 OK` (Spawns `AssistanceSession`) (**PASS**).
  - Eavesdropper accessing private session -> `403 Forbidden` (**PASS**).
  - Session participants chatting -> `200 OK` (**PASS**).
  - Route Memory hazard created & confirmed with decay scoring -> `201 Created` / `200 OK` (**PASS**).
  - Emergency SOS broadcast -> `201 Created` (**PASS**).

### B. REST API & WebSocket Suites
- **Master Endpoint Suite**: [`backend/test_all_endpoints.py`](file:///c:/Users/sanje/Desktop/PROJECTS/routemate/backend/test_all_endpoints.py) -> **PASS (10/10 test categories)**.
- **WebSocket Bidirectional Suite**: [`backend/test_websocket.py`](file:///c:/Users/sanje/Desktop/PROJECTS/routemate/backend/test_websocket.py) -> **PASS** (Multi-client join, broadcast, message routing).

### C. Flutter Code Quality & Unit Tests
- **Flutter Analyzer**: `flutter analyze` -> `No issues found! (0 errors, 0 warnings)` (**PASS**).
- **Flutter Unit & Widget Tests**: `flutter test` -> `All 5 tests passed!` (**PASS**).

### D. Android Device & APK Build Verification
- **Debug APK Build**: `flutter build apk --debug` -> `√ Built build\app\outputs\flutter-apk\app-debug.apk` (**PASS**).
- **Pixel_8 Emulator Installation**: Streamed install to `emulator-5554` -> `Success` (**PASS**).
- **Pixel_8 Emulator Launch**: Activity `org.routemate.app/.MainActivity` focused and running (**PASS**).

---

## 3. Legacy Authentication Cleanup

- **Firebase Auth**: Cleaned and verified removed. (No competing auth).
- **Hardcoded / Fake Users**: Cleaned. Dynamic Supabase user UUIDs and real profiles utilized throughout.
- **Security Check**: 0 private keys or Supabase service-role keys in Flutter client code; only public anon key and project reference `ykqhdpybffwktezvvfyg` configured.
