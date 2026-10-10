# FuturaSculptAI Local Development Runner
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "FuturaSculptAI - Local Cockpit Launcher" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if ports are already listening
$apiPort = 8000
$webPort = 5173

Write-Host "Starting FastAPI Backend on port $apiPort..." -ForegroundColor Green
$apiProcess = Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port $apiPort --reload" -WorkingDirectory "apps/api" -PassThru

Write-Host "Starting React + Vite Frontend on port $webPort..." -ForegroundColor Green
$webProcess = Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "apps/web" -PassThru

Write-Host "`nFuturaSculptAI Cockpit running:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:$webPort" -ForegroundColor White
Write-Host "  Backend:  http://localhost:$apiPort" -ForegroundColor White
Write-Host "  API Docs: http://localhost:$apiPort/docs" -ForegroundColor White
Write-Host "`nPress Ctrl+C or close this window to stop both servers." -ForegroundColor DarkGray

try {
    Wait-Process -Id $apiProcess.Id, $webProcess.Id
} finally {
    Stop-Process -Id $apiProcess.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $webProcess.Id -ErrorAction SilentlyContinue
}
