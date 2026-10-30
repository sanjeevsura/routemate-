# RouteMate — Backend Integration & Infrastructure Requirements

**Target Audience:** Backend Engineer / Infrastructure Lead  
**Document Purpose:** Specifies the exact missing cloud infrastructure and credentials required to switch RouteMate from development fallback mode into full production PostgreSQL/PostGIS and Supabase Auth.

---

## 1. Supabase Cloud Configuration

### 1.1 Real Project Anon Key Required
Currently, the mobile client is configured with project ID `ykqhdpybffwktezvvfyg`, but the `anonKey` in `mobile/lib/core/config/app_config.dart` contains a placeholder signature:
```dart
static const String defaultSupabaseAnonKey = '...placeholder_anon_key';
```
When Supabase SDK calls `https://ykqhdpybffwktezvvfyg.supabase.co/auth/v1/signup`, Supabase's Cloudflare gateway rejects the request:
```json
{
  "message": "Invalid API key",
  "hint": "Double check your Supabase `anon` or `service_role` API key."
}
```

**Required Action:**
1. Navigate to [Supabase Dashboard](https://supabase.com/dashboard/project/ykqhdpybffwktezvvfyg/settings/api).
2. Copy the active **Project API Key (`anon public`)**.
3. Place it in `mobile/lib/core/config/app_config.dart` or `.env`.

### 1.2 JWT Secret for Cryptographic Verification
In `backend/app/core/config.py`:
```python
SUPABASE_JWT_SECRET: Optional[str] = None
```
**Required Action:**
1. Copy the **JWT Secret** from [Supabase API Settings](https://supabase.com/dashboard/project/ykqhdpybffwktezvvfyg/settings/api).
2. Set `SUPABASE_JWT_SECRET="<your-supabase-jwt-secret>"` in `backend/.env`.

---

## 2. PostgreSQL & PostGIS Database Provisioning

### 2.1 Connection String
Currently, FastAPI defaults to SQLite for zero-setup local dev:
```python
DATABASE_URL = "sqlite+aiosqlite:///./routemate_dev.db"
```
FastAPI is built with asynchronous SQLAlchemy 2.0 (`asyncpg`).

**Required Action:**
Provide a production PostgreSQL database URL (e.g. from Supabase Postgres or AWS RDS):
```env
DATABASE_URL="postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

### 2.2 PostGIS Extension
RouteMate models use geographic calculations (haversine fallback and spatial querying). Ensure PostGIS is enabled on the target database:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 2.3 Tables and Schemas
All SQLAlchemy models are defined in `backend/app/models/`:
- `users` (id, email, password_hash, role, full_name, phone, is_active, created_at)
- `traveller_profiles` (id, user_id, preferred_language, emergency_contact_name, emergency_contact_phone)
- `guide_profiles` (id, user_id, specialty, years_experience, languages, coverage_radius_km, rate_per_session_inr, is_available, verification_status, rating)
- `routes` & `route_segments` (corridors, geometry, difficulty, hazards)
- `route_memories` & `route_memory_confirmations` (crowdsourced mountain wisdom, confidence scoring)
- `guide_requests` & `assistance_sessions` (state machines: PENDING, ACCEPTED, ACTIVE, COMPLETED, CANCELLED)
- `session_messages` (live peer-to-peer and offline cached messages)
- `emergency_sos_events` (broadcast coords, elevation, battery level, status)
- `guide_reviews` (ratings 1-5, feedback)
- `complaints` (safety and dispute tracking)

---

## 3. Checklist for Production Cutover

| Item | Requirement | Status | Action Needed |
|---|---|---|---|
| **Supabase URL** | `https://ykqhdpybffwktezvvfyg.supabase.co` | ✅ Configured | None |
| **Supabase Anon Key** | Valid signed JWT key | ⚠️ Placeholder | Provide valid Anon Key |
| **Supabase JWT Secret** | Base64 / HS256 secret | ⚠️ Optional in dev | Set in `backend/.env` |
| **PostgreSQL Database** | PostgreSQL 15+ with `asyncpg` | ⚠️ SQLite active in dev | Set `DATABASE_URL` in `.env` |
| **PostGIS Extension** | `postgis` enabled | ⚠️ Pending DB host | Run `CREATE EXTENSION postgis;` |
| **FastAPI Backend** | Bound to `0.0.0.0:8000` | ✅ Active & Working | None |
| **Android Cleartext** | Allowed for local testing | ✅ Active & Working | None |
