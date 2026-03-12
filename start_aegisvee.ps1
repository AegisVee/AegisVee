$scriptPath = $PSScriptRoot
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"
$pythonPath = "D:\Work\VSaaS\envs\python.exe"

Write-Host "Starting AegisVee System..." -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# 1. Check Python Environment
Write-Host "[1/3] Checking Python Environment..." -ForegroundColor Yellow
if (-not (Test-Path $pythonPath)) {
    Write-Error "CRITICAL: Python not found at $pythonPath"
    Write-Error "Please check your environment path."
    Read-Host "Press Enter to exit..."
    exit 1
}
Write-Host "Found Python at: $pythonPath" -ForegroundColor Gray

function Kill-Port {
    param ([int]$Port)
    $pids = (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique
    if ($pids) {
        foreach ($p in $pids) {
            Write-Host "Port $Port in use by PID: $p. Terminating process..." -ForegroundColor Cyan
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 1
    }
}

Write-Host "Cleaning up previous instances..." -ForegroundColor Yellow
Kill-Port -Port 8000
Kill-Port -Port 5173

# 2. Start Backend
Write-Host "[2/3] Launching Backend Server..." -ForegroundColor Yellow
if (Test-Path $backendPath) {
    # Start Backend in a new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { `$env:HOST_NAME='Backend'; `$host.ui.RawUI.WindowTitle = 'AegisVee Backend'; Write-Host 'Starting FastAPI Server...' -ForegroundColor Green; Set-Location '$backendPath'; & '$pythonPath' main.py }"
    Write-Host "Backend launch command sent." -ForegroundColor Green
}
else {
    Write-Error "Backend directory not found at $backendPath"
}

# 3. Start Frontend
Write-Host "[3/3] Launching Frontend Client..." -ForegroundColor Yellow
if (Test-Path $frontendPath) {
    # Start Frontend in a new window
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { `$env:HOST_NAME='Frontend'; `$host.ui.RawUI.WindowTitle = 'AegisVee Frontend'; Write-Host 'Starting Vite Server...' -ForegroundColor Green; Set-Location '$frontendPath'; npm run dev }"
    Write-Host "Frontend launch command sent." -ForegroundColor Green
}
else {
    Write-Error "Frontend directory not found at $frontendPath"
}

Write-Host "=============================" -ForegroundColor Cyan
Write-Host "AegisVee startup sequence completed." -ForegroundColor Cyan
Write-Host "Please check the opened windows for logs." -ForegroundColor Gray
Start-Sleep -Seconds 3
