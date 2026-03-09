param(
    [ValidateSet("Basic", "Advanced")]
    [string]$Edition = "Advanced"
)

# AegisVee Distribution Packaging Script

$AppName = "AegisVee"
$Version = "2.1.1"
$OutputDir = "d:\Work\aegis-vee-mvp\release"
$SourceDir = "d:\Work\aegis-vee-mvp\frontend\dist\win-unpacked"
$ZipName = "${AppName}-${Edition}-v${Version}-win-x64.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " AegisVee Distribution Packager ($Edition Edition)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kill any running AegisVee / backend processes first
$procs = Get-Process -Name "AegisVee", "backend" -ErrorAction SilentlyContinue
if ($procs) {
    Write-Host "[!] Killing running AegisVee processes..." -ForegroundColor Yellow
    $procs | Stop-Process -Force
    Start-Sleep -Seconds 3
    Write-Host "[OK] Processes stopped" -ForegroundColor Green
}

# Check source exists
if (-not (Test-Path "$SourceDir\AegisVee.exe")) {
    Write-Host "[ERROR] AegisVee.exe not found at $SourceDir" -ForegroundColor Red
    Write-Host "Please run the build first: npm run electron:build" -ForegroundColor Yellow
    exit 1
}

# Create output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

# Copy INSTALL.md into the package
Copy-Item "d:\Work\aegis-vee-mvp\INSTALL.md" "$SourceDir\INSTALL.md" -Force
Write-Host "[OK] Copied INSTALL.md into package" -ForegroundColor Green

# Create zip using 7-Zip if available, otherwise fall back to Compress-Archive
$ZipPath = Join-Path $OutputDir $ZipName

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

Write-Host ""
Write-Host "Creating zip archive..." -ForegroundColor Yellow
Write-Host "  Source: $SourceDir"
Write-Host "  Output: $ZipPath"
Write-Host ""

$7zPath = "C:\Program Files\7-Zip\7z.exe"
if (Test-Path $7zPath) {
    Write-Host "Using 7-Zip (faster)..." -ForegroundColor Yellow
    & $7zPath a -tzip -mx=5 $ZipPath "$SourceDir\*" -r
}
else {
    Write-Host "Using PowerShell Compress-Archive (slower, may take 10+ minutes)..." -ForegroundColor Yellow
    Compress-Archive -Path "$SourceDir\*" -DestinationPath $ZipPath -CompressionLevel Optimal
}

if (Test-Path $ZipPath) {
    $zipSize = [math]::Round((Get-Item $ZipPath).Length / 1GB, 2)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " Done! " -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Zip file: $ZipPath" -ForegroundColor Cyan
    Write-Host "Size:     $zipSize GB" -ForegroundColor Cyan
}
else {
    Write-Host ""
    Write-Host "[ERROR] Zip file was not created." -ForegroundColor Red
    Write-Host "Make sure no other programs are using files in $SourceDir" -ForegroundColor Yellow
}
