param()

$Version = "3.0.0"

# 1. Build Core Edition (local-only, full AI)
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "Building Core Edition" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

$env:AEGISVEE_EDITION = "Core"
Set-Location "d:\Work\aegis-vee-mvp\backend"
& "D:\Work\VSaaS\envs\Scripts\pyinstaller.exe" build_backend.spec --clean -y

Set-Location "d:\Work\aegis-vee-mvp\frontend"
npm run build
npx electron-builder --win --x64

Set-Location "d:\Work\aegis-vee-mvp"
.\package_release.ps1 -Edition Core

# 2. Build Team Edition (local + cloud sync placeholder)
Write-Host "=============================" -ForegroundColor Cyan
Write-Host "Building Team Edition" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

$env:AEGISVEE_EDITION = "Team"
Set-Location "d:\Work\aegis-vee-mvp\backend"
& "D:\Work\VSaaS\envs\Scripts\pyinstaller.exe" build_backend.spec --clean -y

Set-Location "d:\Work\aegis-vee-mvp\frontend"
# No need to vite build again, just repack electron
npx electron-builder --win --x64

Set-Location "d:\Work\aegis-vee-mvp"
.\package_release.ps1 -Edition Team

Write-Host "========================================" -ForegroundColor Green
Write-Host " Both builds packaged successfully! " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
