# FuturaSculptAI Local Development Runner
# Proactively terminates conflicting processes, frees ports 8000 & 5173, and launches full stack.

$ErrorActionPreference = "Continue"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FuturaSculptAI - Local Cockpit Launcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$apiPort = 8000
$webPort = 5173

# Helper function to forcefully kill any process tree listening on a given port
function Stop-PortProcess {
    param([int]$Port)
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($conn in $conns) {
                $pidToKill = $conn.OwningProcess
                if ($pidToKill -and $pidToKill -gt 0) {
                    Write-Host "  Terminating lingering process on port $Port (PID: $pidToKill and child tree)..." -ForegroundColor Yellow
                    taskkill /PID $pidToKill /F /T 2>&1 | Out-Null
                }
            }
        }
    } catch {
        # Fallback to netstat if Get-NetTCPConnection fails
        $lines = netstat -ano | Select-String ":$Port\s+.*LISTENING\s+(\d+)"
        foreach ($line in $lines) {
            if ($line.Line -match ":$Port\s+.*LISTENING\s+(\d+)") {
                $pId = [int]$matches[1]
                if ($pId -gt 0) {
                    taskkill /PID $pId /F /T 2>&1 | Out-Null
                }
            }
        }
    }
}

Write-Host "`n[Pre-flight] Checking and releasing ports $apiPort and $webPort..." -ForegroundColor Yellow
Stop-PortProcess -Port $apiPort
Stop-PortProcess -Port $webPort
Start-Sleep -Seconds 1
Write-Host "  Ports $apiPort and $webPort are free." -ForegroundColor Green

# Locate Python executable
$pythonExe = "python"
if (Test-Path "$PSScriptRoot/../.venv/Scripts/python.exe") {
    $pythonExe = "$PSScriptRoot/../.venv/Scripts/python.exe"
}

# Resolve npm binary on Windows (handles npm.cmd or cmd.exe fallback)
$npmCmd = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
if ($npmCmd) {
    $npmExe = $npmCmd.Source
    $npmArgs = "run dev -- --port $webPort"
} else {
    $npmExe = "cmd.exe"
    $npmArgs = "/c npm run dev -- --port $webPort"
}

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:$apiPort..." -ForegroundColor Green
$apiProcess = Start-Process -FilePath $pythonExe `
    -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port $apiPort --reload" `
    -WorkingDirectory "$PSScriptRoot/../apps/api" `
    -PassThru

if (-not $apiProcess -or $apiProcess.Id -le 0) {
    Write-Host "ERROR: Failed to launch FastAPI backend process." -ForegroundColor Red
    exit 1
}

Write-Host "[2/2] Starting React + Vite Cockpit on http://localhost:$webPort..." -ForegroundColor Green
$webProcess = Start-Process -FilePath $npmExe `
    -ArgumentList $npmArgs `
    -WorkingDirectory "$PSScriptRoot/../apps/web" `
    -PassThru

if (-not $webProcess -or $webProcess.Id -le 0) {
    Write-Host "ERROR: Failed to launch Vite frontend process." -ForegroundColor Red
    if ($apiProcess) { taskkill /PID $apiProcess.Id /F /T 2>&1 | Out-Null }
    exit 1
}

# Give servers 3 seconds to spin up and run a quick probe
Start-Sleep -Seconds 3

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "FuturaSculptAI Full-Stack Cockpit Active:" -ForegroundColor Green
Write-Host "  Executive Cockpit: http://localhost:$webPort" -ForegroundColor White
Write-Host "  Backend API:       http://localhost:$apiPort" -ForegroundColor White
Write-Host "  Swagger Docs:      http://localhost:$apiPort/docs" -ForegroundColor White
Write-Host "  Health Live:       http://localhost:$apiPort/health/live" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "`nServers are running in background. Press Ctrl+C in this console to terminate." -ForegroundColor DarkGray

try {
    while (-not $apiProcess.HasExited -and -not $webProcess.HasExited) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "`nShutting down FuturaSculptAI servers..." -ForegroundColor Yellow
    if ($apiProcess -and -not $apiProcess.HasExited) {
        taskkill /PID $apiProcess.Id /F /T 2>&1 | Out-Null
    }
    if ($webProcess -and -not $webProcess.HasExited) {
        taskkill /PID $webProcess.Id /F /T 2>&1 | Out-Null
    }
    Stop-PortProcess -Port $apiPort
    Stop-PortProcess -Port $webPort
    Write-Host "All processes stopped cleanly." -ForegroundColor Green
}
