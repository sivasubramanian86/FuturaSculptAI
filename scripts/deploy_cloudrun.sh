#!/usr/bin/env bash
# FuturaSculptAI Google Cloud Run Deployment Script (Linux / macOS / Chromebook)
# Provisions and deploys backend API and executive cockpit to Google Cloud Run.

set -euo pipefail

PROJECT_ID="${1:-genai-apac-2026-491004}"
REGION="${2:-asia-southeast1}"
API_SERVICE="${3:-futurasculpt-api}"
WEB_SERVICE="${4:-futurasculpt-web}"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}==========================================================${NC}"
echo -e "${CYAN}FuturaSculptAI - Google Cloud Run Deployment Pipeline${NC}"
echo -e "${CYAN}==========================================================${NC}"
echo -e "Target Project: ${WHITE}${PROJECT_ID}${NC}"
echo -e "Target Region:  ${WHITE}${REGION}${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 1. Pre-flight Authentication & Project Check
echo -e "\n${YELLOW}[Step 1/4] Verifying Google Cloud CLI Authentication...${NC}"
ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null || true)
if [ -z "${ACTIVE_ACCOUNT}" ]; then
    echo -e "${RED}ERROR: No active gcloud account. Run 'gcloud auth login' first.${NC}"
    exit 1
fi
echo -e "  ${GREEN}Authenticated Account: ${ACTIVE_ACCOUNT}${NC}"

gcloud config set project "${PROJECT_ID}"
echo -e "  ${GREEN}Active Project configured: ${PROJECT_ID}${NC}"

# 2. Deploy Backend API to Cloud Run
echo -e "\n${YELLOW}[Step 2/4] Deploying Backend API to Cloud Run (${API_SERVICE})...${NC}"
cd "${ROOT_DIR}/apps/api"
gcloud run deploy "${API_SERVICE}" \
    --source . \
    --region "${REGION}" \
    --project "${PROJECT_ID}" \
    --platform managed \
    --allow-unauthenticated \
    --set-env-vars "GCP_PROJECT_ID=${PROJECT_ID},ENVIRONMENT=production,MOCK_LLM_MODE=false,VERTEX_AI_LOCATION=us-central1" \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --timeout 300

API_URL=$(gcloud run services describe "${API_SERVICE}" --region "${REGION}" --project "${PROJECT_ID}" --format="value(status.url)")
echo -e "  ${GREEN}Backend API Deployed Successfully: ${API_URL}${NC}"

# 3. Deploy Executive Cockpit Frontend
echo -e "\n${YELLOW}[Step 3/4] Building and Deploying Frontend Cockpit (${WEB_SERVICE})...${NC}"
cd "${ROOT_DIR}/apps/web"
npm run build
echo -e "  ${GREEN}Frontend compiled to dist/.${NC}"

gcloud run deploy "${WEB_SERVICE}" \
    --source . \
    --region "${REGION}" \
    --project "${PROJECT_ID}" \
    --platform managed \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1

WEB_URL=$(gcloud run services describe "${WEB_SERVICE}" --region "${REGION}" --project "${PROJECT_ID}" --format="value(status.url)")
echo -e "  ${GREEN}Frontend Cockpit Deployed Successfully: ${WEB_URL}${NC}"

# 4. Post-Deployment Verification Probe
echo -e "\n${YELLOW}[Step 4/4] Executing Post-Deployment Liveness Probes...${NC}"
if [ -n "${API_URL}" ]; then
    curl -sf "${API_URL}/health/live" >/dev/null && echo -e "  ${GREEN}Liveness Probe (${API_URL}/health/live): OK${NC}" || echo -e "  ${YELLOW}Liveness Probe: Pending${NC}"
    curl -sf "${API_URL}/health/ready" >/dev/null && echo -e "  ${GREEN}Readiness Probe (${API_URL}/health/ready): OK${NC}" || echo -e "  ${YELLOW}Readiness Probe: Pending${NC}"
fi

echo -e "\n${GREEN}==========================================================${NC}"
echo -e "${GREEN}DEPLOYMENT COMPLETE${NC}"
echo -e "  Executive Cockpit: ${WHITE}${WEB_URL}${NC}"
echo -e "  Backend API:       ${WHITE}${API_URL}${NC}"
echo -e "  Swagger Docs:      ${WHITE}${API_URL}/docs${NC}"
echo -e "${GREEN}==========================================================${NC}"
