# ROUTEMATE — UI/UX DESIGN & ACCESSIBILITY AUDIT

**Date:** 2026-10-05  
**Design Standard:** Commercial Production Quality  
**Status:** ✅ Verified & Polished  

---

## 1. Design Principles Applied

1. **Clean & Modern Aesthetic**:
   - Palette based on deep indigo (`#1E293B`), ocean blue (`#0284C7`), and emerald teal (`#10B981`).
   - Clean card-based layouts without unnecessary glow effects, neon accents, or giant gradients.

2. **Global Language Localization**:
   - Top-right header globe icon (`LanguageSelectorButton`) accessible on all main screens.
   - Instant language switching across English, Tamil (தமிழ்), Telugu (తెలుగు), Malayalam (മലയാളം), and Hindi (हिन्दी).
   - Dynamic text bounds testing prevents overflow on regional font scripts.

3. **Central Component Architecture**:
   - `RMButton`: Consistent primary action button with built-in loading spinner and disabled state.
   - `RMSecondaryButton`: Outlined button for secondary actions.
   - `RMTextField`: Material 3 input field with error messaging, show/hide password toggle, and focus highlight.
   - `RMCard`: Standardized container with light border and subtle shadow.
   - `RMStatusChip`: Status badges for guide verification, trip status, and emergency alerts.

4. **Error Handling & User Masking**:
   - No raw technical exceptions (`DioException`, `SocketException`, `TimeoutException`, IP addresses) are presented to end users.
   - All errors are formatted into localized, actionable human messages (`"Unable to connect to RouteMate server. Please check your internet connection and try again."`).
   - Development server configuration UI (`settings_ethernet`) is hidden behind `if (kDebugMode)` in production builds.

---

## 2. Multi-Role Screen Summary

### Traveller Role
- **Welcome & Auth**: Clean onboarding, Supabase SignUp/SignIn, role selector.
- **Home**: Greeting, language selector, destination search bar, quick action cards (Navigate, Find Guide, Nearby Essentials, Route Memory), map preview.
- **Map & Navigation**: Full-screen MapLibre canvas, location marker, OSRM route overlay, step-by-step guidance cards.
- **Nearby Places**: Categorized grid (Hospitals, Hotels, Restaurants, Pharmacies, Fuel, Police, ATMs) with distance and directions.
- **Guide Request**: Proximity list of verified guides, 30-second server TTL countdown sheet.
- **Chat & Session**: Real-time WS chat, end session trigger, guide rating modal (1–5 stars) & review submission.

### Guide Role
- **Dashboard**: Availability toggle (ACTIVE / OFFLINE), completed trips count, rating score badge, active request cards.
- **Request Acceptance**: Countdown timer, route distance preview, Accept/Decline action buttons.
- **Session Control**: Navigation to traveller, real-time chat gateway, session complete trigger.

### Admin Role
- **Command Center**: Key performance metrics (Total Travellers, Total Guides, Verified Guides, Active Sessions, Open Complaints, SOS Alerts).
- **Guide Management**: Comprehensive guide table with verification approval, rejection, and suspension controls based on multi-factor metrics (ratings, completed trips, cancellations, complaints).
- **Complaints & SOS Monitoring**: Live complaint resolution drawer and safety alert dashboard.
