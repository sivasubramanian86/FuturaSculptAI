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
    $connections = netstat -ano | Select-String ":$Port\s+.*LISTENING\s+(\d+)"
    foreach ($match in $connections) {
        if ($match.Line -match ":$Port\s+.*LISTENING\s+(\d+)") {
            $procId = [int]$matches[1]
            if ($procId -gt 0) {
                Write-Host "  Terminating process on port $Port (PID: $procId and child tree)..." -ForegroundColor Yellow
                taskkill /PID $procId /F /T 2>&1 | Out-Null
            }
        }
    }
    # Double check with Get-NetTCPConnection if available
    try {
        $netConns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $netConns) {
            if ($conn.OwningProcess -gt 0) {
                taskkill /PID $conn.OwningProcess /F /T 2>&1 | Out-Null
            }
        }
    } catch { }
}

Write-Host "`n[Pre-flight] Checking and releasing ports $apiPort and $webPort..." -ForegroundColor Yellow
Stop-PortProcess -Port $apiPort
Stop-PortProcess -Port $webPort
Start-Sleep -Seconds 1
Write-Host "  Ports are free." -ForegroundColor Green

# Locate Python executable
$pythonExe = "python"
if (Test-Path "$PSScriptRoot/../.venv/Scripts/python.exe") {
    $pythonExe = "$PSScriptRoot/../.venv/Scripts/python.exe"
}

Write-Host "`n[1/2] Starting FastAPI Backend on http://localhost:$apiPort..." -ForegroundColor Green
$apiProcess = Start-Process -FilePath $pythonExe `
    -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port $apiPort --reload" `
    -WorkingDirectory "$PSScriptRoot/../apps/api" `
    -PassThru

Write-Host "[2/2] Starting React + Vite Cockpit on http://localhost:$webPort..." -ForegroundColor Green
$webProcess = Start-Process -FilePath "npm" `
    -ArgumentList "run dev -- --port $webPort" `
    -WorkingDirectory "$PSScriptRoot/../apps/web" `
    -PassThru

# Give servers 3 seconds to spin up and run a quick probe
Start-Sleep -Seconds 3

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "FuturaSculptAI Full-Stack Cockpit Active:" -ForegroundColor Green
Write-Host "  Executive Cockpit: http://localhost:$webPort" -ForegroundColor White
Write-Host "  Backend API:       http://localhost:$apiPort" -ForegroundColor White
Write-Host "  Swagger Docs:      http://localhost:$apiPort/docs" -ForegroundColor White
Write-Host "  Health Live:       http://localhost:$apiPort/health/live" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "`nPress Ctrl+C in this console to terminate both servers." -ForegroundColor DarkGray

try {
    Wait-Process -Id $apiProcess.Id, $webProcess.Id
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
