# ROUTEMATE — FRONTEND API INTEGRATION STATUS

**Date:** 2026-10-05  
**Scope:** Status of Flutter screens mapped to FastAPI endpoints

---

## Endpoint & Screen Connectivity Table

| Feature / Screen | API Endpoint | HTTP Method | Request Body / Query | Flutter Client Handler | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **System Health** | `/health` | `GET` | None | `ApiClient.healthCheck()` | ✅ Connected and tested |
| **Traveller Login** | `/api/v1/auth/login` | `POST` | `email`, `password` | `ApiClient.login()` | ✅ Connected and tested |
| **Guide Login** | `/api/v1/auth/login` | `POST` | `email`, `password` | `ApiClient.login()` | ✅ Connected and tested |
| **Admin Login** | `/api/v1/auth/login` | `POST` | `email`, `password` | `ApiClient.login()` | ✅ Connected and tested |
| **User Registration** | `/api/v1/auth/register` | `POST` | `UserCreate` schema | `ApiClient.register()` | ✅ Connected and tested |
| **Restore Session** | `/api/v1/auth/me` | `GET` | Bearer Token | `ApiClient.getMe()` | ✅ Connected and tested |
| **Logout** | `/api/v1/auth/logout` | `POST` | Bearer Token | `ApiClient.logout()` | ✅ Connected and tested |
| **Geocoding Search**| `/api/v1/geocoding/search`| `GET` | `q` query string | `ApiClient.searchPlaces()` | ✅ Connected and tested |
| **OSRM Route Directions**|`/api/v1/routes/directions`|`GET` | `from`, `to` coordinates | `ApiClient.getDirections()` | ✅ Connected and tested |
| **Guide Discovery** | `/api/v1/guides` | `GET` | `lat`, `lon`, `radius` | `ApiClient.getGuides()` | ✅ Connected and tested |
| **Toggle Availability**| `/api/v1/guides/availability`| `POST` | `is_available`, `lat`, `lon`| `ApiClient.updateGuideAvailability()`| ✅ Connected and tested |
| **Request Guide** | `/api/v1/requests/create` | `POST` | `guide_id`, `origin`, `destination`| `ApiClient.createGuideRequest()`| ✅ Connected and tested |
| **Pending Requests**| `/api/v1/requests/pending` | `GET` | Bearer Token | `ApiClient.getPendingRequests()`| ✅ Connected and tested |
| **Respond Request** | `/api/v1/requests/{id}/respond`|`POST`| `action` (`ACCEPT`/`DECLINE`)| `ApiClient.respondToRequest()`| ✅ Connected and tested |
| **Session Info** | `/api/v1/sessions/{id}` | `GET` | Bearer Token | `ApiClient.getSession()` | ✅ Connected and tested |
| **Send Message** | `/api/v1/sessions/{id}/messages`|`POST`| `text`, `latitude`, `longitude`| `ApiClient.sendMessage()` | ✅ Connected and tested |
| **Live WebSocket** | `/ws/sessions/{id}` | `WS` | Query `token` | `WebSocketChannel` | ✅ Connected and tested |
| **Route Memories** | `/api/v1/route-memory` | `GET` / `POST` | `RouteMemoryCreate` | `ApiClient.getRouteMemories()` | ✅ Connected and tested |
| **Confirm Memory** | `/api/v1/route-memory/{id}/confirm`|`POST`| `action` (`STILL_THERE`/`REPORT_CLEARED`)| `ApiClient.confirmRouteMemory()`| ✅ Connected and tested |
| **SOS Broadcast** | `/api/v1/sos/broadcast` | `POST` | `latitude`, `longitude`, `elevation`| `ApiClient.broadcastSos()` | ✅ Connected and tested |
| **Admin Overview** | `/api/v1/admin/overview` | `GET` | Bearer Token (ADMIN role) | `ApiClient.getAdminOverview()` | ✅ Connected and tested |
| **Verify Guide** | `/api/v1/admin/verify-guide` | `POST` | `guide_id`, `action` | `ApiClient.verifyGuide()` | ✅ Connected and tested |
