# FuturaSculptAI Comprehensive Local Quality & Security Scanner
# Enforces 100% test coverage, zero linter errors, zero Bandit issues, and zero leaked credentials.

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "FuturaSculptAI - 100% Local Quality & Security Audit Gate" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Secret Scanner
Write-Host "`n[Gate 1/6] Running Local Credential & Secret Scanner..." -ForegroundColor Yellow
$secretScanResult = pwsh -NoProfile -ExecutionPolicy Bypass -File "$PSScriptRoot/security_scan.ps1"
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED: Credentials or secrets detected in repository!" -ForegroundColor Red
    exit 1
}
Write-Host "  PASSED: 0 secrets detected." -ForegroundColor Green

# 2. Python Ruff Linter & Formatter Check
Write-Host "`n[Gate 2/6] Running Ruff Linter on Backend..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot/../apps/api"
try {
    python -m ruff check .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: Ruff linting checks failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  PASSED: Ruff 0 errors, 100% clean." -ForegroundColor Green

    # 3. Python Bandit AST Security Scan
    Write-Host "`n[Gate 3/6] Running Bandit AST Security Scan on Backend..." -ForegroundColor Yellow
    python -m bandit -r app
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: Bandit identified security vulnerabilities!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  PASSED: Bandit 0 issues." -ForegroundColor Green

    # 4. Backend Pytest with 100% Statement and Branch Coverage
    Write-Host "`n[Gate 4/6] Running Pytest with 100% Branch Coverage..." -ForegroundColor Yellow
    python -m pytest --cov=app --cov-branch --cov-report=term-missing --cov-fail-under=100
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: Backend test coverage under 100% or tests failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  PASSED: Pytest 100.0% statement and branch coverage." -ForegroundColor Green
} finally {
    Pop-Location
}

# 5. Frontend TypeScript and Vitest 100% Coverage
Write-Host "`n[Gate 5/6] Running Frontend Vitest 100% Coverage Suite..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot/../apps/web"
try {
    npm run test:coverage
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: Frontend unit tests or coverage below 100%!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  PASSED: Vitest 100.0% coverage." -ForegroundColor Green

    # 6. Frontend Production Build Check
    Write-Host "`n[Gate 6/6] Verifying Frontend Production Build..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "FAILED: Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  PASSED: Vite production build succeeded." -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "ALL GATES PASSED (100% Perfection Score across all suites)" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
exit 0
