# RouteMate Server Connection — End-to-End Diagnostic & Verification Report

**Document Status:** ✅ VERIFIED & FULLY FUNCTIONAL  
**Device Target:** Android Emulator `emulator-5554` (Pixel 8)  
**Backend Target:** FastAPI (`0.0.0.0:8000`)  
**Auth Target:** Supabase Project `ykqhdpybffwktezvvfyg` + JWT Synchronizer  
**Database Target:** SQLite Dev Fallback / PostgreSQL (`routemate_dev.db`)

---

## 1. Executive Summary & Verification Matrix

The end-to-end connection chain from the Android emulator (`emulator-5554`) to the FastAPI backend, Supabase Auth service, and Database engine has been diagnosed, configured with non-sensitive debug tracing, and verified live on the Pixel 8 emulator.

```
+-----------------------------------------------------------------------------------+
|                            ROUTEMATE CONNECTION PIPELINE                          |
|                                                                                   |
|  [Android Emulator]  ---(10.0.2.2:8000)--->  [FastAPI Backend 0.0.0.0:8000]       |
|   (Cleartext/Internet)                         |                                  |
|         |                                      +---> [/api/v1/health]  (HTTP 200) |
|         |                                      +---> [/auth/register]  (HTTP 201) |
|         +---> [Supabase Auth Client]           +---> [/auth/login]     (HTTP 200) |
|                (Project: ykqhdpybffwktezvvfyg) +---> [/auth/me]        (HTTP 200) |
|                                                        |                          |
|                                                        +---> [Database] (CONNECTED)
+-----------------------------------------------------------------------------------+
```

### Component Status Matrix

| Layer | Component | Target / Value | Status |
|---|---|---|---|
| **Server** | FastAPI Process | `uvicorn app.main:app` (Host: `0.0.0.0`, Port: `8000`) | ✅ VERIFIED |
| **Server** | Host Health Endpoint | `http://127.0.0.1:8000/api/v1/health` | ✅ VERIFIED (HTTP 200) |
| **Database** | Database Engine | SQLite dev fallback (`routemate_dev.db`) / AsyncSession | ✅ VERIFIED (`CONNECTED`) |
| **Android** | Emulator Status | `emulator-5554` | ✅ VERIFIED (`device`) |
| **Android** | Effective API URL | `http://10.0.2.2:8000/api/v1` | ✅ VERIFIED |
| **Android** | Cleartext Traffic | `android:usesCleartextTraffic="true"` | ✅ VERIFIED |
| **Android** | Internet Permission | `android.permission.INTERNET` | ✅ VERIFIED |
| **Network** | Emulator → FastAPI | `GET http://10.0.2.2:8000/api/v1/health` | ✅ VERIFIED (HTTP 200) |
| **Auth** | Supabase Project | `https://ykqhdpybffwktezvvfyg.supabase.co` | ✅ VERIFIED |
| **Auth** | Registration Endpoint | `POST /api/v1/auth/register` | ✅ VERIFIED (HTTP 201) |
| **Auth** | User Session / Role | `GET /api/v1/auth/me` | ✅ VERIFIED (HTTP 200, TRAVELLER) |
| **Auth** | Logout Flow | `POST /api/v1/auth/logout` | ✅ VERIFIED (HTTP 200) |
| **Auth** | Login Endpoint | `POST /api/v1/auth/login` | ✅ VERIFIED (HTTP 200) |

---

## 2. Root Cause Analysis & Resolution

### Root Cause Audit
1. **Server Host Binding:** The FastAPI backend is bound to `0.0.0.0:8000` rather than `127.0.0.1:8000`. This allows the Android emulator router (`10.0.2.2`) to bridge host loopback traffic into the host process seamlessly.
2. **Android Security Configuration:** The Android manifest was verified to have `android:usesCleartextTraffic="true"` and `android.permission.INTERNET`, permitting development HTTP communication without HTTPS certificate errors on `10.0.2.2`.
3. **Debug Instrumentation:** Added non-sensitive development debug logging (`[RouteMate DEBUG]`) in `api_client.dart` without logging user passwords or secret tokens.

---

## 3. Real Runtime Logcat Evidence (Emulator-5554)

The following log trace was captured directly from `adb -s emulator-5554 logcat -d -s flutter` during live testing:

```log
10-05 17:45:39.087 18707 18736 I flutter : [IMPORTANT:flutter/shell/platform/android/android_context_gl_impeller.cc(104)] Using the Impeller rendering backend (OpenGLES).
10-05 17:45:39.607 18707 18745 I flutter : The Dart VM service is listening on http://127.0.0.1:39815/kRa6PRZ31h4=/
10-05 17:45:42.541 18707 18707 I flutter : supabase.supabase_flutter: INFO: ***** Supabase init completed ***** 
10-05 17:45:42.544 18707 18707 I flutter : [SupabaseService] Initialized successfully with project ykqhdpybffwktezvvfyg
10-05 17:45:46.385 18707 18707 I flutter : [RouteMate DEBUG] API BASE URL: http://10.0.2.2:8000/api/v1 | REQUEST: http://10.0.2.2:8000/api/v1/health | METHOD: GET (Health Check)
10-05 17:45:47.881 18707 18707 I flutter : [RouteMate DEBUG] Health Check STATUS: 200 | BODY: {"status":"ONLINE","service":"RouteMate Core Engine","version":"1.0.0","database":"CONNECTED","database_engine":"SQLite (Development Fallback)","database_url_configured":"sqlite+aiosqlite:///./routemate_dev.db"}
10-05 17:46:15.913 18707 18707 I flutter : [LocaleNotifier] Switched locale to: ta
10-05 17:48:25.834 18707 18707 I flutter : [RouteMate DEBUG] API BASE URL: http://10.0.2.2:8000/api/v1 | REQUEST: http://10.0.2.2:8000/api/v1/auth/register | METHOD: POST
10-05 17:48:27.467 18707 18707 I flutter : [RouteMate DEBUG] STATUS: 201 | RESPONSE: {"access_token":"eyJhbGciOiJIUzI1Ni...
10-05 17:48:27.539 18707 18707 I flutter : [RouteMate DEBUG] API BASE URL: http://10.0.2.2:8000/api/v1 | REQUEST: http://10.0.2.2:8000/api/v1/auth/me | METHOD: GET
10-05 17:48:27.615 18707 18707 I flutter : [RouteMate DEBUG] STATUS: 200 | RESPONSE: {"id":"usr-e469d9a8b493","email":"tester_diag_01@routemate.org","full_name":"Dev Tester","role":"TRAVELLER","phone":"9876543210","is_active":true,"created_at":"2026-10-05T12:18:26"}
10-05 17:50:01.106 18707 18707 I flutter : supabase.auth: INFO: Signing out user with scope: local 
10-05 17:50:01.268 18707 18707 I flutter : [RouteMate DEBUG] API BASE URL: http://10.0.2.2:8000/api/v1 | REQUEST: http://10.0.2.2:8000/api/v1/auth/logout | METHOD: POST
10-05 17:50:02.190 18707 18707 I flutter : [RouteMate DEBUG] STATUS: 200 | RESPONSE: {"success":true,"message":"Logged out successfully"}
10-05 17:51:02.223 18707 18707 I flutter : [RouteMate DEBUG] API BASE URL: http://10.0.2.2:8000/api/v1 | REQUEST: http://10.0.2.2:8000/api/v1/auth/login | METHOD: POST
10-05 17:51:03.208 18707 18707 I flutter : [RouteMate DEBUG] STATUS: 200 | RESPONSE: {"access_token":"eyJhbGciOiJIUzI1Ni...
10-05 17:51:03.239 18707 18707 I flutter : [RouteMate DEBUG] API BASE URL: http://10.0.2.2:8000/api/v1 | REQUEST: http://10.0.2.2:8000/api/v1/auth/me | METHOD: GET
10-05 17:51:03.255 18707 18707 I flutter : [RouteMate DEBUG] STATUS: 200 | RESPONSE: {"id":"usr-e469d9a8b493","email":"tester_diag_01@routemate.org","full_name":"Dev Tester","role":"TRAVELLER","phone":"9876543210","is_active":true,"created_at":"2026-10-05T12:18:26"}
```
