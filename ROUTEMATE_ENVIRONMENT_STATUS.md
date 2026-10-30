# ROUTEMATE — ENVIRONMENT STATUS & SERVICE DIAGNOSTIC REPORT

**Report Date:** 2026-10-05  
**System Status:** 🟢 All Core Services Operational  

---

## 1. System Environment Check

| Tool / Service | Command / Check | Version / Status | Diagnostic Result |
|---|---|---|---|
| **Flutter SDK** | `flutter --version` | Flutter 3.29.0 / Dart 3.7.0 | 🟢 Installed & Configured |
| **Android SDK & ADB** | `adb devices` | ADB 1.0.41 / `emulator-5554` | 🟢 Pixel_8 Connected (`device`) |
| **Java Runtime** | `java -version` | OpenJDK 17.0.12 | 🟢 Compatible |
| **Python Virtualenv** | `backend\venv\Scripts\python.exe` | Python 3.14.4 | 🟢 Dependencies Active |
| **FastAPI Backend** | `GET http://localhost:8000/health` | `RouteMate Core Engine 1.0.0` | 🟢 ONLINE (`status: ONLINE`) |
| **Supabase Cloud Auth** | `https://ykqhdpybffwktezvvfyg.supabase.co` | Supabase JS / Flutter SDK v2.8 | 🟢 Session Verified |
| **Node.js / Vite** | `npm --version` | Node v22.14 / Vite 6.1 | 🟢 QA Dashboard Available |

---

## 2. Startup Utility Scripts

- **`RUN_QA_CENTER.bat`**: Single-command script located in project root that checks backend status, verifies ADB emulator connections, runs pytest suite, and starts the QA Control Center.
- **`build_apks.ps1`**: PowerShell script to clean, analyze, test, and compile both debug and release APKs.
