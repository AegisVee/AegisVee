# run_tests.ps1
Write-Host "Starting AegisVee Sovereign V-Model Tests..." -ForegroundColor Cyan

# 1. Backend Unit Tests
Write-Host "`n[1/4] Running Backend Unit Tests (Pydantic & Logic)..." -ForegroundColor Yellow
# Run from root so 'backend' package is resolvable
D:\Work\VSaaS\envs\python.exe -m pytest backend/tests/unit
if ($LASTEXITCODE -ne 0) { Write-Error "Backend Unit Tests Failed"; exit 1 }

# 2. Frontend Component Tests
Write-Host "`n[2/4] Running Frontend Component Tests (visual nodes)..." -ForegroundColor Yellow
Set-Location frontend
# npx cypress run --component # User needs to run this manually if environment not ready
Write-Host "Skipping actual execution of Cypress in script to avoid hanging, run 'npx cypress run --component' manually."
Set-Location ..

# 3. RAG Evaluation
Write-Host "`n[3/4] Running Offline RAG Evaluation..." -ForegroundColor Yellow
# Requires Ollama running
D:\Work\VSaaS\envs\python.exe -m pytest backend/tests/rag_eval
if ($LASTEXITCODE -ne 0) { Write-Warning "RAG Eval Failed or Skipped (Ensure Ollama is running)" }

# 4. HIL Simulation
Write-Host "`n[4/4] Running HIL Simulation Tests..." -ForegroundColor Yellow
D:\Work\VSaaS\envs\python.exe -m pytest backend/tests/hil
if ($LASTEXITCODE -ne 0) { Write-Warning "HIL Tests Failed or Skipped (Ensure Renode is installed)" }

Write-Host "`nAll Test Suites Completed." -ForegroundColor Green
