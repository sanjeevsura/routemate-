@echo off
TITLE RouteMate — Development & QA Control Center
COLOR 0A
cls

echo ================================================================
echo           ROUTEMATE — QA & DEVELOPMENT CONTROL CENTER
echo ================================================================
echo.

echo [1/4] Checking Python & Backend API Status...
powershell -Command "try { $res = Invoke-RestMethod -Uri 'http://localhost:8000/health' -Method Get -TimeoutSec 3; Write-Host '   [OK] FastAPI Backend ONLINE:' $res.service -ForegroundColor Green } catch { Write-Host '   [WARNING] FastAPI Backend not responding on http://localhost:8000. Launching Uvicorn in background...' -ForegroundColor Yellow; Start-Process -FilePath 'backend\venv\Scripts\python.exe' -ArgumentList '-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload' -WorkingDirectory 'backend' }"

echo.
echo [2/4] Checking ADB & Android Emulator Connections...
adb devices

echo.
echo [3/4] Running Automated Tests Gate...
powershell -Command "Write-Host '   Running backend pytest...' -ForegroundColor Cyan"
$env:PYTHONPATH="backend"; backend\venv\Scripts\pytest.exe backend/tests -q

echo.
echo [4/4] Launching RouteMate QA Control Center Web Interface...
echo Open your browser at: http://localhost:5173
echo.
npm run dev
