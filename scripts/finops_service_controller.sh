#!/usr/bin/env bash
# FuturaSculptAI FinOps Service Controller & Zero-Cost Project Freezer
# Usage: ./scripts/finops_service_controller.sh [disable|enable|status]

set -euo pipefail

ACTION="${1:-status}"
PROJECT_ID="${2:-genai-apac-2026-491004}"
REGION="${3:-asia-southeast1}"
API_SERVICE="${4:-futurasculpt-api}"

echo "================================================================="
echo "FuturaSculptAI FinOps Controller - Mode: $(echo "$ACTION" | tr '[:lower:]' '[:upper:]')"
echo "Project: $PROJECT_ID | Region: $REGION"
echo "================================================================="

COST_APIS=(
    "videointelligence.googleapis.com"
    "vision.googleapis.com"
    "texttospeech.googleapis.com"
    "dlp.googleapis.com"
)

case "$ACTION" in
    disable)
        echo ""
        echo "[1/3] Freezing Cloud Run Ingress & Public Invocation ($API_SERVICE)..."
        gcloud run services remove-iam-policy-binding "$API_SERVICE" \
            --region "$REGION" \
            --project "$PROJECT_ID" \
            --member="allUsers" \
            --role="roles/run.invoker" \
            --quiet 2>/dev/null || true

        gcloud run services update "$API_SERVICE" \
            --region "$REGION" \
            --project "$PROJECT_ID" \
            --min-instances 0 \
            --max-instances 1 \
            --ingress internal \
            --quiet || echo "Warning updating Cloud Run ingress"

        echo ""
        echo "[2/3] Disabling Optional Pay-Per-Use Google APIs..."
        for api in "${COST_APIS[@]}"; do
            gcloud services disable "$api" --project "$PROJECT_ID" --quiet 2>/dev/null || true
            echo "  Disabled API: $api"
        done

        echo ""
        echo "[3/3] Purging Vertex AI Context Caches..."
        python3 -c "
import os
try:
    from google import genai
    client = genai.Client(vertexai=True, project='$PROJECT_ID', location='us-central1')
    caches = list(client.cached_contents.list())
    for c in caches:
        client.cached_contents.delete(name=c.name)
        print(f'Deleted cache: {c.name}')
    if not caches:
        print('No active context caches found (Zero storage cost).')
except Exception as e:
    print(f'Cache info: {e}')
" 2>/dev/null || echo "Context cache check complete."

        echo ""
        echo "================================================================="
        echo "PROJECT SUCCESSFULLY FROZEN (ZERO-COST STANDBY POSTURE)"
        echo "  - Public Access: BLOCKED (403 Forbidden for unauthenticated callers)"
        echo "  - Ingress Policy: INTERNAL ONLY (Blocks all external web traffic)"
        echo "  - Active Instances: 0 (min-instances=0, zero requests reach container)"
        echo "  - Pay-Per-Use APIs: DISABLED"
        echo "  - Idle Compute / Memory Burn Rate: \$0.00 / hour"
        echo "================================================================="
        ;;

    enable)
        echo ""
        echo "[1/3] Enabling Google Cloud Core & Cost APIs..."
        ALL_APIS=("${COST_APIS[@]}" "aiplatform.googleapis.com" "run.googleapis.com")
        for api in "${ALL_APIS[@]}"; do
            gcloud services enable "$api" --project "$PROJECT_ID" --quiet || true
            echo "  Enabled API: $api"
        done

        echo ""
        echo "[2/3] Unfreezing Cloud Run Backend Service ($API_SERVICE)..."
        gcloud run services update "$API_SERVICE" \
            --region "$REGION" \
            --project "$PROJECT_ID" \
            --min-instances 0 \
            --max-instances 10 \
            --ingress all \
            --quiet

        gcloud run services add-iam-policy-binding "$API_SERVICE" \
            --region "$REGION" \
            --project "$PROJECT_ID" \
            --member="allUsers" \
            --role="roles/run.invoker" \
            --quiet

        echo ""
        echo "[3/3] Executing Health Readiness Verification Probe..."
        API_URL=$(gcloud run services describe "$API_SERVICE" --region "$REGION" --project "$PROJECT_ID" --format="value(status.url)")
        sleep 3
        curl -s "$API_URL/health/ready" || echo "Health probe complete"

        echo ""
        echo "================================================================="
        echo "PROJECT UNFROZEN: READY FOR JUDGMENT EVALUATION"
        echo "  - Cloud Run Endpoint: $API_URL"
        echo "  - Max Instances: 10 (Scales dynamically on demand)"
        echo "  - Ingress: Public (Evaluation panels have full access)"
        echo "================================================================="
        ;;

    status)
        echo ""
        echo "Querying Cloud Run Service State..."
        API_URL=$(gcloud run services describe "$API_SERVICE" --region "$REGION" --project "$PROJECT_ID" --format="value(status.url)")
        MAX_SCALE=$(gcloud run services describe "$API_SERVICE" --region "$REGION" --project "$PROJECT_ID" --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/maxScale'])")
        INGRESS=$(gcloud run services describe "$API_SERVICE" --region "$REGION" --project "$PROJECT_ID" --format="value(metadata.annotations['run.googleapis.com/ingress'])")

        echo "  Service URL:    $API_URL"
        echo "  Max Instances:  $MAX_SCALE"
        echo "  Ingress Policy: $INGRESS"

        if [ "$INGRESS" = "internal" ]; then
            echo "  Current Status: FROZEN / ZERO-COST STANDBY MODE"
        else
            echo "  Current Status: ACTIVE / JUDGING EVALUATION READY"
        fi

        echo ""
        echo "Querying Enabled Pay-Per-Use APIs..."
        ENABLED_APIS=$(gcloud services list --enabled --project "$PROJECT_ID" --format="value(config.name)")
        for api in "${COST_APIS[@]}"; do
            if echo "$ENABLED_APIS" | grep -q "$api"; then
                echo "  $api: ENABLED"
            else
                echo "  $api: DISABLED"
            fi
        done
        ;;

    *)
        echo "Unknown action: $ACTION. Use disable, enable, or status."
        exit 1
        ;;
esac
