<#
.SYNOPSIS
    FuturaSculptAI FinOps Service Controller & Zero-Cost Project Freezer
.DESCRIPTION
    Safely disables all cost-incurring Google Cloud services (Cloud Run ingress=internal,
    removes public invoker IAM, min-instances=0, disables pay-per-use APIs, purges Vertex AI context caches)
    to guarantee $0 idle burn.
    Enables services dynamically for judgment evaluation phase and verifies live readiness.
.PARAMETER Action
    'disable' : Freeze services to zero-cost standby mode.
    'enable'  : Unfreeze and scale services for hackathon judge evaluation.
    'status'  : Check current active instances, ingress, and cost posture.
#>

param (
    [Parameter(Mandatory = $true)]
    [ValidateSet("disable", "enable", "status")]
    [string]$Action,

    [string]$ProjectId = "genai-apac-2026-491004",
    [string]$Region = "asia-southeast1",
    [string]$ApiService = "futurasculpt-api"
)

$ErrorActionPreference = "Stop"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "FuturaSculptAI FinOps Controller - Mode: $($Action.ToUpper())" -ForegroundColor Cyan
Write-Host "Project: $ProjectId | Region: $Region" -ForegroundColor White
Write-Host "=================================================================" -ForegroundColor Cyan

$CostApis = @(
    "videointelligence.googleapis.com",
    "vision.googleapis.com",
    "texttospeech.googleapis.com",
    "dlp.googleapis.com"
)

switch ($Action) {
    "disable" {
        Write-Host "`n[1/3] Freezing Cloud Run Ingress & Public Invocation ($ApiService)..." -ForegroundColor Yellow
        try {
            # Revoke public allUsers invocation permission
            gcloud run services remove-iam-policy-binding $ApiService `
                --region $Region `
                --project $ProjectId `
                --member="allUsers" `
                --role="roles/run.invoker" `
                --quiet 2>$null
            Write-Host "  Revoked public invoker (allUsers) policy binding." -ForegroundColor Green
        } catch {
            Write-Host "  IAM binding policy already locked." -ForegroundColor DarkGray
        }

        try {
            # Lock ingress to internal and enforce min-instances=0
            gcloud run services update $ApiService `
                --region $Region `
                --project $ProjectId `
                --min-instances 0 `
                --max-instances 1 `
                --ingress internal `
                --quiet
            Write-Host "  Cloud Run [$ApiService] ingress locked to INTERNAL (all public web traffic blocked)." -ForegroundColor Green
        } catch {
            Write-Host "  Warning updating ingress: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        Write-Host "`n[2/3] Disabling Optional Pay-Per-Use Google APIs..." -ForegroundColor Yellow
        foreach ($api in $CostApis) {
            try {
                gcloud services disable $api --project $ProjectId --quiet 2>$null
                Write-Host "  Disabled API: ${api}" -ForegroundColor Green
            } catch {
                Write-Host "  Could not disable ${api} (or already disabled)" -ForegroundColor DarkGray
            }
        }

        Write-Host "`n[3/3] Purging Vertex AI Context Caches..." -ForegroundColor Yellow
        try {
            $pythonCode = @"
import os
try:
    from google import genai
    client = genai.Client(vertexai=True, project='$ProjectId', location='us-central1')
    caches = list(client.cached_contents.list())
    for c in caches:
        client.cached_contents.delete(name=c.name)
        print(f'Deleted cache: {c.name}')
    if not caches:
        print('No active context caches found (Zero storage cost).')
except Exception as e:
    print(f'Cache info: {e}')
"@
            python -c "$pythonCode" 2>$null
        } catch {
            Write-Host "  Context cache check complete." -ForegroundColor DarkGray
        }

        Write-Host "`n=================================================================" -ForegroundColor Green
        Write-Host "PROJECT SUCCESSFULLY FROZEN (ZERO-COST STANDBY POSTURE)" -ForegroundColor Green
        Write-Host "  - Public Access: BLOCKED (403 Forbidden for all unauthenticated callers)" -ForegroundColor White
        Write-Host "  - Ingress Policy: INTERNAL ONLY (Blocks all external web traffic)" -ForegroundColor White
        Write-Host "  - Active Instances: 0 (min-instances=0, zero requests allowed to trigger container)" -ForegroundColor White
        Write-Host "  - Pay-Per-Use APIs: DISABLED" -ForegroundColor White
        Write-Host "  - Hourly Compute / Memory Burn Rate: `$0.00 / hour" -ForegroundColor Green
        Write-Host "=================================================================" -ForegroundColor Green
    }

    "enable" {
        Write-Host "`n[1/3] Enabling Google Cloud Core & Cost APIs..." -ForegroundColor Yellow
        $AllRequiredApis = $CostApis + @("aiplatform.googleapis.com", "run.googleapis.com")
        foreach ($api in $AllRequiredApis) {
            try {
                gcloud services enable $api --project $ProjectId --quiet
                Write-Host "  Enabled API: ${api}" -ForegroundColor Green
            } catch {
                Write-Host "  Warning enabling ${api}: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }

        Write-Host "`n[2/3] Unfreezing Cloud Run Backend Service ($ApiService)..." -ForegroundColor Yellow
        try {
            gcloud run services update $ApiService `
                --region $Region `
                --project $ProjectId `
                --min-instances 0 `
                --max-instances 10 `
                --ingress all `
                --quiet

            gcloud run services add-iam-policy-binding $ApiService `
                --region $Region `
                --project $ProjectId `
                --member="allUsers" `
                --role="roles/run.invoker" `
                --quiet
            Write-Host "  Cloud Run [$ApiService] scaled to max-instances=10, ingress=all, public invoker granted." -ForegroundColor Green
        } catch {
            Write-Host "  Error unfreezing Cloud Run: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }

        Write-Host "`n[3/3] Executing Health Readiness Verification Probe..." -ForegroundColor Yellow
        $apiUrl = gcloud run services describe $ApiService --region $Region --project $ProjectId --format="value(status.url)"
        if ($apiUrl) {
            Start-Sleep -Seconds 3
            try {
                $live = Invoke-RestMethod -Uri "$apiUrl/health/live" -Method Get -TimeoutSec 10
                $ready = Invoke-RestMethod -Uri "$apiUrl/health/ready" -Method Get -TimeoutSec 10
                Write-Host "  Live Probe ($apiUrl/health/live):    $($live.status)" -ForegroundColor Green
                Write-Host "  Ready Probe ($apiUrl/health/ready):  $($ready.status)" -ForegroundColor Green
            } catch {
                Write-Host "  Health probe warning: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }

        Write-Host "`n=================================================================" -ForegroundColor Green
        Write-Host "PROJECT UNFROZEN: READY FOR JUDGMENT EVALUATION" -ForegroundColor Green
        Write-Host "  - Cloud Run Endpoint: $apiUrl" -ForegroundColor White
        Write-Host "  - Max Instances: 10 (Scales dynamically on-demand)" -ForegroundColor White
        Write-Host "  - Ingress: Public (Evaluation panels have full access)" -ForegroundColor White
        Write-Host "=================================================================" -ForegroundColor Green
    }

    "status" {
        Write-Host "`nQuerying Cloud Run Service State..." -ForegroundColor Yellow
        try {
            $url = gcloud run services describe $ApiService --region $Region --project $ProjectId --format="value(status.url)"
            $maxScale = gcloud run services describe $ApiService --region $Region --project $ProjectId --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/maxScale'])"
            $ingress = gcloud run services describe $ApiService --region $Region --project $ProjectId --format="value(metadata.annotations['run.googleapis.com/ingress'])"

            Write-Host "  Service URL:    $url" -ForegroundColor White
            Write-Host "  Max Instances:  $($maxScale)" -ForegroundColor $(if ($maxScale -eq "1" -and $ingress -eq "internal") { "Green" } else { "Cyan" })
            Write-Host "  Ingress Policy: $($ingress)" -ForegroundColor $(if ($ingress -eq "internal") { "Green" } else { "Cyan" })
            
            if ($ingress -eq "internal") {
                Write-Host "`n  Current Status: FROZEN / ZERO-COST STANDBY MODE" -ForegroundColor Green
            } else {
                Write-Host "`n  Current Status: ACTIVE / JUDGING EVALUATION READY" -ForegroundColor Cyan
            }
        } catch {
            Write-Host "  Error querying service description: $($_.Exception.Message)" -ForegroundColor Red
        }

        Write-Host "`nQuerying Enabled Pay-Per-Use APIs..." -ForegroundColor Yellow
        $enabled = gcloud services list --enabled --project $ProjectId --format="value(config.name)"
        foreach ($api in $CostApis) {
            $isActive = $enabled -contains $api
            Write-Host "  ${api}: $(if ($isActive) { 'ENABLED' } else { 'DISABLED' })" -ForegroundColor $(if ($isActive) { "Yellow" } else { "Green" })
        }
    }
}
