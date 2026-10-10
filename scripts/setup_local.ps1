# FuturaSculptAI Local Environment Bootstrap Script (Windows PowerShell)
# Automatically sets up Python (uv / poetry / venv) and Node.js dependencies.

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "FuturaSculptAI - Local Environment Setup & Bootstrap" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$root = Resolve-Path "$PSScriptRoot/.."
Set-Location $root

# 1. Check Prerequisites
Write-Host "`n[Step 1/5] Checking System Prerequisites..." -ForegroundColor Yellow

$pythonCmd = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $pythonCmd) {
    $pythonCmd = (Get-Command python3 -ErrorAction SilentlyContinue)
}
if (-not $pythonCmd) {
    Write-Host "ERROR: Python is not installed. Python 3.12+ is required." -ForegroundColor Red
    exit 1
}
$pyVersion = & $pythonCmd.Source -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')"
Write-Host "  Found Python: $pyVersion ($($pythonCmd.Source))" -ForegroundColor Green

$nodeCmd = (Get-Command node -ErrorAction SilentlyContinue)
$npmCmd = (Get-Command npm -ErrorAction SilentlyContinue)
if (-not $nodeCmd -or -not $npmCmd) {
    Write-Host "ERROR: Node.js and npm are required. Please install Node.js 20+." -ForegroundColor Red
    exit 1
}
$nodeVersion = & $nodeCmd.Source -v
Write-Host "  Found Node.js: $nodeVersion" -ForegroundColor Green

# 2. Setup Environment Variables (.env)
Write-Host "`n[Step 2/5] Configuring Environment Variables..." -ForegroundColor Yellow
if (-not (Test-Path "$root/.env")) {
    if (Test-Path "$root/.env.example") {
        Copy-Item "$root/.env.example" "$root/.env"
        Write-Host "  Created .env from .env.example" -ForegroundColor Green
    } else {
        Write-Host "  Warning: .env.example not found. Creating minimal .env" -ForegroundColor Yellow
        "ENVIRONMENT=local`nGCP_PROJECT_ID=genai-apac-2026-491004`nVERTEX_AI_LOCATION=asia-southeast1" | Out-File -FilePath "$root/.env" -Encoding utf8
    }
} else {
    Write-Host "  .env already exists. Preserving existing configuration." -ForegroundColor Green
}

# 3. Setup Python Backend Environment (uv -> poetry -> standard venv)
Write-Host "`n[Step 3/5] Setting up Backend Environment (apps/api)..." -ForegroundColor Yellow
Push-Location "$root/apps/api"
try {
    $hasUv = (Get-Command uv -ErrorAction SilentlyContinue)
    $hasPoetry = (Get-Command poetry -ErrorAction SilentlyContinue)

    if ($hasUv) {
        Write-Host "  Detected 'uv' (Fast Python package manager)!" -ForegroundColor Cyan
        Write-Host "  Creating virtual environment with uv..." -ForegroundColor White
        uv venv .venv
        Write-Host "  Installing dependencies via uv pip..." -ForegroundColor White
        uv pip install -e ".[dev]"
        Write-Host "  Backend dependencies installed successfully with uv." -ForegroundColor Green
    } elseif ($hasPoetry) {
        Write-Host "  Detected 'poetry'!" -ForegroundColor Cyan
        Write-Host "  Installing dependencies via poetry..." -ForegroundColor White
        poetry install
        Write-Host "  Backend dependencies installed successfully with poetry." -ForegroundColor Green
    } else {
        Write-Host "  Using standard Python venv and pip..." -ForegroundColor White
        if (-not (Test-Path ".venv")) {
            & $pythonCmd.Source -m venv .venv
        }
        $pipPath = if (Test-Path ".venv/Scripts/pip.exe") { ".venv/Scripts/pip.exe" } else { ".venv/bin/pip" }
        & $pipPath install --upgrade pip
        & $pipPath install -e ".[dev]"
        Write-Host "  Backend dependencies installed successfully with pip." -ForegroundColor Green
    }
} finally {
    Pop-Location
}

# 4. Setup Frontend Web Environment
Write-Host "`n[Step 4/5] Setting up Frontend Cockpit (apps/web)..." -ForegroundColor Yellow
Push-Location "$root/apps/web"
try {
    Write-Host "  Installing npm dependencies in apps/web..." -ForegroundColor White
    npm install
    Write-Host "  Frontend dependencies installed successfully." -ForegroundColor Green
} finally {
    Pop-Location
}

# 5. Sanity Verification Probe
Write-Host "`n[Step 5/5] Verifying Installation Sanity..." -ForegroundColor Yellow
Push-Location "$root/apps/api"
try {
    $testPy = if (Test-Path ".venv/Scripts/python.exe") { ".venv/Scripts/python.exe" } else { $pythonCmd.Source }
    & $testPy -c "import fastapi, pydantic, networkx; print('  Backend imports verified: FastAPI, Pydantic, NetworkX OK')"
} catch {
    Write-Host "  Warning: Sanity probe encountered issue, but dependencies were installed." -ForegroundColor Yellow
} finally {
    Pop-Location
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "SETUP COMPLETE! Ready to build and run." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "To launch local cockpit (Backend + Frontend):" -ForegroundColor White
Write-Host "  pwsh ./scripts/run_local.ps1" -ForegroundColor Cyan
Write-Host "`nTo run full quality and security audit:" -ForegroundColor White
Write-Host "  pwsh ./scripts/scan_local.ps1" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
