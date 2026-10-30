# ROUTEMATE — BACKEND AUDIT & API ROUTE MAP

**Audit Date:** 2026-10-05  
**Auditor:** Antigravity Autonomous Development Agent  
**Target System:** RouteMate Core Backend Engine (FastAPI)

---

## 1. Executive Summary

The RouteMate backend is built on **FastAPI** using an asynchronous SQLAlchemy 2.0 architecture with JWT authentication, custom role-based access control (RBAC), and server-authoritative request lifecycle logic.

- **Development Fallback Database:** SQLite via `aiosqlite` (`routemate_dev.db`) — 🟡 DEVELOPMENT FALLBACK ONLY.
- **Target Server Database:** PostgreSQL + PostGIS (`postgresql+psycopg://...`).
- **Mobile Offline Database:** Drift + SQLite (in Flutter app `mobile/lib/core/offline`).

---

## 2. Comprehensive Endpoint Catalog & Implementation Status

| Method | Endpoint Path | Auth Required | Role | DB Engine / Dependency | Implementation Status | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | No | Any | `db.execute("SELECT 1")` | ✅ Complete | ✅ Passed |
| `GET` | `/api/v1/health` | No | Any | `db.execute("SELECT 1")` | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/auth/register` | No | Any | User, TravellerProfile, GuideProfile | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/auth/login` | No | Any | User table | ✅ Complete | ✅ Passed |
| `GET` | `/api/v1/auth/me` | Yes | Any | User table | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/admin/verify-guide` | Yes | ADMIN | GuideProfile | ✅ Complete | ✅ Passed |
| `GET` | `/api/v1/admin/overview` | Yes | ADMIN | Aggregated Stats | ✅ Complete | ✅ Passed |
| `GET` | `/api/v1/guides` | No | Any | GuideProfile / Location | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/guides/availability` | Yes | GUIDE | GuideProfile | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/requests/create` | Yes | TRAVELLER | GuideRequest (30s TTL) | ✅ Complete | ✅ Passed |
| `GET` | `/api/v1/requests/pending` | Yes | GUIDE / TRAVELLER | GuideRequest | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/requests/{id}/respond` | Yes | GUIDE | GuideRequest, AssistanceSession | ✅ Complete | ✅ Passed |
| `GET` | `/api/v1/sessions/{id}` | Yes | Session Participant | AssistanceSession | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/sessions/{id}/messages` | Yes | Session Participant | SessionMessage | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/sessions/{id}/end` | Yes | Session Participant | AssistanceSession | ✅ Complete | ✅ Passed |
| `GET` | `/api/v1/route-memory` | No | Any | RouteMemory | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/route-memory` | Yes | Any | RouteMemory | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/route-memory/{id}/confirm` | Yes | Any | RouteMemory | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/sos/broadcast` | Yes | TRAVELLER | SosEvent | ✅ Complete | ✅ Passed |
| `GET` | `/api/v1/geocoding/search` | No | Any | Photon API / Komoot | ✅ Complete | ✅ Passed |
| `GET` | `/api/v1/routes/directions` | No | Any | OSRM Driving Engine | ✅ Complete | ✅ Passed |
| `POST` | `/api/v1/ai/extract-hazard` | No | Any | `@google/genai` Gemini 2.5/3.6 | ✅ Graceful Fallback | ✅ Passed |
| `WS` | `/ws/sessions/{id}` | Yes (Query token) | Session Participant | ConnectionManager | ✅ Complete | ✅ Passed |
