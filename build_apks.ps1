# RouteMate APK Build Script
# Usage: .\build_apks.ps1 [-Debug] [-Release] [-All]
# Default (no args): builds BOTH debug and release
param(
    [switch]$DebugOnly,
    [switch]$ReleaseOnly,
    [switch]$All
)

$FlutterBin = "C:\Users\sanje\flutter\bin\flutter.bat"
$MobileDir  = "$PSScriptRoot\mobile"
$OutputDir  = "$PSScriptRoot\apks"

$env:Path = "C:\Users\sanje\flutter\bin;" + $env:Path
$env:PUB_ENVIRONMENT             = "flutter_bot"
$env:FLUTTER_SUPPRESS_ANALYTICS  = "true"

if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

function Build-Debug {
    Write-Host "`n====  Building DEBUG APK  ====" -ForegroundColor Cyan
    Push-Location $MobileDir
    & $FlutterBin build apk --debug
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -eq 0) {
        $src = "$MobileDir\build\app\outputs\flutter-apk\app-debug.apk"
        if (Test-Path $src) {
            Copy-Item $src "$OutputDir\app-debug.apk" -Force
            $sz = [math]::Round((Get-Item $src).Length / 1MB, 2)
            Write-Host "  DEBUG APK ready: $OutputDir\app-debug.apk  ($sz MB)" -ForegroundColor Green
        }
    } else {
        Write-Host "  DEBUG build FAILED (exit $code)" -ForegroundColor Red
    }
}

function Build-Release {
    Write-Host "`n====  Building RELEASE APK  ====" -ForegroundColor Cyan
    Push-Location $MobileDir
    & $FlutterBin build apk --release --no-tree-shake-icons
    $code = $LASTEXITCODE
    Pop-Location
    if ($code -eq 0) {
        $src = "$MobileDir\build\app\outputs\flutter-apk\app-release.apk"
        if (Test-Path $src) {
            Copy-Item $src "$OutputDir\app-release.apk" -Force
            $sz = [math]::Round((Get-Item $src).Length / 1MB, 2)
            Write-Host "  RELEASE APK ready: $OutputDir\app-release.apk  ($sz MB)" -ForegroundColor Green
        }
    } else {
        Write-Host "  RELEASE build FAILED (exit $code)" -ForegroundColor Red
    }
}

Write-Host "RouteMate APK Builder  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Yellow
Write-Host "Output: $OutputDir"

$doDebug   = $DebugOnly   -or $All -or (-not $DebugOnly -and -not $ReleaseOnly)
$doRelease = $ReleaseOnly -or $All -or (-not $DebugOnly -and -not $ReleaseOnly)

if ($doDebug)   { Build-Debug }
if ($doRelease) { Build-Release }

Write-Host "`n====  Done  ====" -ForegroundColor Yellow
if (Test-Path $OutputDir) {
    Get-ChildItem $OutputDir -Filter "app-*.apk" |
        Sort-Object LastWriteTime -Descending |
        Select-Object Name, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}}, LastWriteTime |
        Format-Table -AutoSize
}
