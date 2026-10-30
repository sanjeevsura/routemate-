# RouteMate — Supabase Integration & Database Requirements

**Document Version:** 1.0.0  
**Supabase Project Reference ID:** `ykqhdpybffwktezvvfyg`  
**Supabase API URL:** `https://ykqhdpybffwktezvvfyg.supabase.co`  
**Authentication Standard:** Supabase Auth (PKCE flow, JWT signed tokens)  
**Database Backend:** PostgreSQL with PostGIS extension  

---

## 1. Executive Summary

RouteMate authentication is integrated with **Supabase Authentication**. Supabase serves as the single source of truth for user credentials, password hashing, session tokens, and OAuth/PKCE sign-in flows. The FastAPI server validates Supabase-issued JWT Bearer tokens and links the Supabase user UUID (`auth.users.id`) directly to relational domain models (profiles, active assistance sessions, real-time messaging, route memories, and emergency SOS alerts).

---

## 2. Architecture & Token Verification Flow

```
Flutter Mobile App
       │
       ├── (1) SignUp / SignIn ──> Supabase Auth (Project: ykqhdpybffwktezvvfyg)
       │                              │
       │   <── (2) Supabase Session ──┘
       │       (JWT Access Token)
       │
       └── (3) HTTP / WS with "Authorization: Bearer <JWT>"
               │
               ▼
       FastAPI Core Engine
               │
               ├── (4) Verify Supabase JWT (`sub`, `iss`, `exp`)
               ├── (5) Authorize Role (TRAVELLER, GUIDE, ADMIN)
               └── (6) Execute Domain Operation
                       │
                       ▼
       PostgreSQL / PostGIS (Spatial & Relational Store)
```

---

## 3. Database Schema Mapping & Requirements

### A. User Identity (`auth.users` ↔ `public.users`)
- **Supabase User ID**: Stored as a UUID v4 string (e.g. `3a4f8e21-50e2-45e0-8da1-9c3f81e3a450`).
- **RouteMate `users` table**:
  - `id`: `VARCHAR(64)` or `UUID` primary key matching `auth.users(id)`.
  - `email`: `VARCHAR(255)` unique indexed string.
  - `role`: Enum `('TRAVELLER', 'GUIDE', 'ADMIN')`.
  - `full_name`: `VARCHAR(255)`.
  - `phone`: `VARCHAR(32)` optional.
  - `is_active`: `BOOLEAN` default `TRUE`.

### B. Guide Profile (`public.guide_profiles`)
- `id`: `VARCHAR(64)` PK.
- `user_id`: Foreign key referencing `users(id)` ON DELETE CASCADE.
- `verification_status`: Enum `('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED')`.
- `specialty`: `VARCHAR(255)` (e.g., Mountain Pass Guide, High-Altitude Navigator).
- `years_experience`: `INTEGER`.
- `languages`: `JSONB` or text array `["English", "Malayalam", "Tamil", "Hindi"]`.
- `coverage_radius_km`: `DOUBLE PRECISION` default `15.0`.
- `rate_per_session_inr`: `DOUBLE PRECISION` default `150.0`.
- `is_available`: `BOOLEAN` default `FALSE`.
- `rating`: `DOUBLE PRECISION` default `5.0`.
- `verified_trips`: `INTEGER` default `0`.
- `latitude` & `longitude`: `DOUBLE PRECISION` (or PostGIS `geometry(Point, 4326)`).

### C. Assistance Sessions (`public.sessions`)
- `id`: `VARCHAR(64)` PK (`sess-...`).
- `traveller_id`: FK `users(id)`.
- `guide_id`: FK `users(id)`.
- `route_corridor`: `VARCHAR(255)`.
- `status`: Enum `('CREATED', 'MATCHED', 'ACCEPTED', 'ACTIVE', 'COMPLETED', 'CANCELLED')`.
- `mode`: Enum `('VOICE', 'CHAT', 'MEET', 'REMOTE')`.

### D. Route Memories & Hazard Pins (`public.route_memories`)
- `id`: `VARCHAR(64)` PK (`mem-...`).
- `title`: `VARCHAR(255)`.
- `category`: Enum `('HAZARD', 'DETOUR', 'ROAD_CLOSURE', 'FLOOD', 'BRIDGE', 'CONSTRUCTION', 'FUEL', 'HOSPITAL', 'POLICE', 'LANDMARK')`.
- `status`: Enum `('ACTIVE', 'CLEARED', 'EXPIRED')`.
- `latitude` & `longitude`: Coordinates.
- `confirmations`: `INTEGER` (upvotes increment confidence by +2%).
- `confidence_percent`: `INTEGER` (initial 70%, degrades with 'REPORT_CLEARED' by -15%).

---

## 4. Supabase Client Configuration

| Setting | Variable / Parameter | Production Value / Pattern |
| :--- | :--- | :--- |
| Project Reference ID | `SUPABASE_PROJECT_REF` | `ykqhdpybffwktezvvfyg` |
| Supabase URL | `SUPABASE_URL` | `https://ykqhdpybffwktezvvfyg.supabase.co` |
| Auth Flow | PKCE Flow | Enabled (`FlutterAuthClientOptions(authFlowType: AuthFlowType.pkce)`) |
| Service Role Key | Backend Only | **NEVER** expose to Flutter client or Git repository |

---

## 5. Security & Isolation Matrix

1. **Client Isolation**: Flutter client only holds the Supabase public anon key and connects to Supabase Auth.
2. **Authoritative Roles**: Roles are validated server-side by FastAPI via database query and server verification.
3. **Admin Endpoints**: Protected with `get_current_admin` dependency; non-admin users receive `403 Forbidden`.
4. **WebSocket Security**: WebSockets require valid token verification before handshake and session association.
