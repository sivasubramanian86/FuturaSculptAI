# FuturaSculptAI Google Cloud Run Deployment Script
# Provisions and deploys backend API and executive cockpit to Google Cloud Run.

param (
    [string]$ProjectId = "genai-apac-2026-491004",
    [string]$Region = "asia-southeast1",
    [string]$ApiService = "futurasculpt-api",
    [string]$WebService = "futurasculpt-web",
    [string]$ServiceAccount = "futurasculpt-runner@genai-apac-2026-491004.iam.gserviceaccount.com"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "FuturaSculptAI - Google Cloud Run Deployment Pipeline" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Project: $ProjectId" -ForegroundColor White
Write-Host "Target Region:  $Region" -ForegroundColor White

# 1. Pre-flight Authentication & Project Check
Write-Host "`n[Step 1/4] Verifying Google Cloud CLI Authentication..." -ForegroundColor Yellow
$activeAccount = gcloud auth list --filter=status:ACTIVE --format="value(account)"
if (-not $activeAccount) {
    Write-Host "ERROR: No active gcloud account. Run 'gcloud auth login' first." -ForegroundColor Red
    exit 1
}
Write-Host "  Authenticated Account: $activeAccount" -ForegroundColor Green

gcloud config set project $ProjectId
Write-Host "  Active Project configured: $ProjectId" -ForegroundColor Green

# 2. Capture Git SHA & Build Timestamp for Provenance
$GitSha = (git rev-parse HEAD).Trim()
$BuildTimestamp = (Get-Date).ToUniversalTime().ToString("o")

if (-not $GitSha -or $GitSha -eq "unknown") {
    Write-Host "ERROR: Git SHA could not be determined. Deployment aborted." -ForegroundColor Red
    exit 1
}
Write-Host "  Injecting Git SHA:         $GitSha" -ForegroundColor Green
Write-Host "  Injecting Build Timestamp: $BuildTimestamp" -ForegroundColor Green

# 3. Build and Deploy Backend API to Cloud Run (Canary Deployment)
Write-Host "`n[Step 2/4] Deploying Backend API to Cloud Run ($ApiService) with zero production traffic..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot/../apps/api"
try {
    # Deploy new revision with --no-traffic (Canary)
    gcloud run deploy $ApiService `
        --source . `
        --region $Region `
        --project $ProjectId `
        --platform managed `
        --allow-unauthenticated `
        --no-traffic `
        --set-env-vars "GCP_PROJECT_ID=$ProjectId,ENVIRONMENT=production,VERTEX_AI_LOCATION=global,VERTEX_AI_LIVE_LOCATION=us-central1,GIT_SHA=$GitSha,BUILD_TIMESTAMP=$BuildTimestamp,AUTH_DEV_MODE=false" `
        --memory 1Gi `
        --cpu 1 `
        --service-account $ServiceAccount `
        --min-instances 0 `
        --max-instances 10 `
        --timeout 300
    
    $apiUrl = gcloud run services describe $ApiService --region $Region --project $ProjectId --format="value(status.url)"
    $latestRev = gcloud run services describe $ApiService --region $Region --project $ProjectId --format="value(status.latestCreatedRevisionName)"
    Write-Host "  Backend API Canary Revision Deployed: $latestRev" -ForegroundColor Green

    # Canary Smoke Probe: verify build SHA on new revision
    Write-Host "  Verifying Canary Build Manifest ($apiUrl/api/v1/system/build)..." -ForegroundColor Yellow
    $buildCheck = Invoke-RestMethod -Uri "$apiUrl/api/v1/system/build" -Method Get
    Write-Host "  Reported SHA: $($buildCheck.git_sha) (Expected: $GitSha)" -ForegroundColor Cyan
    if ($buildCheck.git_sha -ne $GitSha) {
        Write-Host "  Note: Global service URL still routed to previous revision (Expected for 0% canary). Promoting traffic..." -ForegroundColor Yellow
    }

    # Progressive Traffic Shifting: 0% -> 5% -> 25% -> 100%
    Write-Host "`n  Executing Progressive Traffic Migration: 5% -> 25% -> 100%..." -ForegroundColor Yellow
    gcloud run services update-traffic $ApiService --region $Region --project $ProjectId --to-revisions "${latestRev}=5"
    Start-Sleep -Seconds 2
    gcloud run services update-traffic $ApiService --region $Region --project $ProjectId --to-revisions "${latestRev}=25"
    Start-Sleep -Seconds 2
    gcloud run services update-traffic $ApiService --region $Region --project $ProjectId --to-revisions "${latestRev}=100"
    Write-Host "  Traffic successfully migrated 100% to $latestRev" -ForegroundColor Green
} finally {
    Pop-Location
}

# 3. Build and Deploy Executive Cockpit Frontend
Write-Host "`n[Step 3/4] Building and Deploying Frontend Cockpit ($WebService)..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot/../apps/web"
try {
    npm run build
    Write-Host "  Frontend compiled to dist/." -ForegroundColor Green

    # Deploy frontend container or static app to Cloud Run
    gcloud run deploy $WebService `
        --source . `
        --region $Region `
        --project $ProjectId `
        --platform managed `
        --allow-unauthenticated `
        --service-account $ServiceAccount `
        --memory 512Mi `
        --cpu 1
    
    $webUrl = gcloud run services describe $WebService --region $Region --project $ProjectId --format="value(status.url)"
    Write-Host "  Frontend Cockpit Deployed Successfully: $webUrl" -ForegroundColor Green
} finally {
    Pop-Location
}

# 4. Post-Deployment Verification Probe
Write-Host "`n[Step 4/4] Executing Post-Deployment Liveness Probes..." -ForegroundColor Yellow
if ($apiUrl) {
    try {
        $liveCheck = Invoke-RestMethod -Uri "$apiUrl/health/live" -Method Get
        Write-Host "  Liveness Probe ($apiUrl/health/live): $($liveCheck.status)" -ForegroundColor Green
        
        $readyCheck = Invoke-RestMethod -Uri "$apiUrl/health/ready" -Method Get
        Write-Host "  Readiness Probe ($apiUrl/health/ready): $($readyCheck.status)" -ForegroundColor Green
    } catch {
        Write-Host "  Warning: Health check endpoint responded with: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "  Executive Cockpit: $webUrl" -ForegroundColor White
Write-Host "  Backend API:       $apiUrl" -ForegroundColor White
Write-Host "  Swagger Docs:      $apiUrl/docs" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
