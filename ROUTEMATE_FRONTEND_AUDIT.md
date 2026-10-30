# ROUTEMATE — FRONTEND & API INTEGRATION AUDIT

**Audit Date:** 2026-10-05  
**Auditor:** Antigravity Autonomous Development Agent  
**Target App:** RouteMate Flutter Application (`mobile/`)

---

## 1. Executive Summary

The RouteMate Flutter application is built on Flutter 3.38.1 with `flutter_riverpod`, `go_router`, `flutter_map`, `drift`, and `flutter_secure_storage`. 

- **Authentication System:** 100% FastAPI + JWT + `flutter_secure_storage` (Zero Firebase Auth dependencies).
- **Firebase Usage:** Firebase Authentication removed completely; Firebase reserved exclusively for FCM push notifications if enabled.
- **Server Address Config:** Dynamic `AppConfig.defaultHost` (`10.0.2.2:8000` for Android emulator) with runtime custom LAN IP configuration UI (`ServerSettingsDialog`).
- **Database Boundary:** Server DB (PostgreSQL + PostGIS) is managed by the server team/friend. Mobile offline DB uses Drift + SQLite (`mobile/lib/core/offline`).

---

## 2. Screen & Feature Audit Catalog

| Screen / Feature | Route Path | Auth Required | Role | Backend API Connection | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Splash Screen** | `/splash` | No | Any | `GET /health`, `GET /auth/me` | ✅ Complete |
| **Welcome Screen** | `/welcome` | No | Any | N/A (Role selection) | ✅ Complete |
| **Login Screen** | `/login` | No | Any | `POST /auth/login` | ✅ Complete |
| **Register Screen** | `/register` | No | Any | `POST /auth/register` | ✅ Complete |
| **Traveller Home** | `/traveller` | Yes | TRAVELLER | `GET /guides`, GPS, Geolocator | ✅ Complete |
| **Destination Search**| `/destination-search` | Yes | TRAVELLER | `GET /geocoding/search` | ✅ Complete |
| **Route Preview** | `/route-preview` | Yes | TRAVELLER | `GET /routes/directions`, OSRM | ✅ Complete |
| **Active Navigation** | `/active-navigation` | Yes | TRAVELLER | Navigation telemetry, Geolocator | ✅ Complete |
| **Guide Dashboard** | `/guide` | Yes | GUIDE | `GET /requests/pending`, Availability | ✅ Complete |
| **Admin Command** | `/admin` | Yes | ADMIN | `GET /admin/overview`, Verify Guide | ✅ Complete |
| **Active Session** | `/session/:id` | Yes | Participant | `GET /sessions/:id`, WebSocket | ✅ Complete |
| **Route Memory** | `/route-memory` | Yes | Any | `GET/POST /route-memory` | ✅ Complete |
| **Safety / SOS** | `/safety` | Yes | Any | `POST /sos/broadcast` | ✅ Complete |
| **User Profile** | `/profile` | Yes | Any | `GET /auth/me`, Logout | ✅ Complete |

---

## 3. Firebase & Security Compliance Audit

1. **Firebase Auth Removal:** Checked `pubspec.yaml` and entire `mobile/lib` codebase — zero `firebase_auth` dependencies or code imports exist.
2. **Secure Token Storage:** Auth tokens (`access_token`, `user_id`, `role`) are stored securely using `FlutterSecureStorage` (`flutter_secure_storage`).
3. **Cleartext HTTP:** Configured `android:usesCleartextTraffic="true"` in `mobile/android/app/src/main/AndroidManifest.xml` to support local dev backend connection (`10.0.2.2:8000` & LAN IPs).
