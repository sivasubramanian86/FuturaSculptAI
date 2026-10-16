#!/usr/bin/env bash
# FuturaSculptAI Live Production Verification & Smoke Test Script (Linux / macOS / Chromebook)
# Validates frontend availability, backend health, build manifest, WorkTwin endpoints, and Gemini Live Native Audio.

set -euo pipefail

API_BASE="${1:-https://futurasculpt-api-967518492968.asia-southeast1.run.app}"
WEB_BASE="${2:-https://futurasculptai.web.app}"
TENANT_ID="tenant-food-mfg-01"

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}==========================================================${NC}"
echo -e "${CYAN}FuturaSculptAI - Production Deployment Verification Suite${NC}"
echo -e "${CYAN}==========================================================${NC}"
echo -e "API Target:  ${WHITE}${API_BASE}${NC}"
echo -e "Web Target:  ${WHITE}${WEB_BASE}${NC}"
echo -e "Tenant ID:   ${WHITE}${TENANT_ID}${NC}\n"

# 1. Frontend Web Availability Check
echo -e "${YELLOW}[1/6] Verifying Executive Cockpit Frontend...${NC}"
WEB_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${WEB_BASE}/")
if [ "${WEB_CODE}" != "200" ]; then
    echo -e "  ${RED}FAILED: Frontend returned HTTP ${WEB_CODE}${NC}"
    exit 1
fi
echo -e "  ${GREEN}PASSED: Frontend online (HTTP 200)${NC}"

# 2. Backend Health & Readiness
echo -e "\n${YELLOW}[2/6] Verifying Backend Health & Liveness...${NC}"
HEALTH_JSON=$(curl -s "${API_BASE}/health/live")
echo "  Payload: ${HEALTH_JSON}"
if [[ "${HEALTH_JSON}" != *"UP"* ]]; then
    echo -e "  ${RED}FAILED: Health probe did not report UP${NC}"
    exit 1
fi
echo -e "  ${GREEN}PASSED: Backend liveness confirmed${NC}"

# 3. Verifiable Build Manifest Endpoint
echo -e "\n${YELLOW}[3/6] Verifying Build Manifest (/api/v1/system/build)...${NC}"
BUILD_JSON=$(curl -s "${API_BASE}/api/v1/system/build")
echo "  Payload: ${BUILD_JSON}"
if [[ "${BUILD_JSON}" != *"FuturaSculptAI"* ]]; then
    echo -e "  ${RED}FAILED: Build manifest missing or invalid${NC}"
    exit 1
fi
echo -e "  ${GREEN}PASSED: Build manifest verified${NC}"

# 4. OpenAPI Specification Availability
echo -e "\n${YELLOW}[4/6] Verifying OpenAPI Specification...${NC}"
OPENAPI_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE}/openapi.json")
if [ "${OPENAPI_CODE}" != "200" ]; then
    echo -e "  ${RED}FAILED: openapi.json returned HTTP ${OPENAPI_CODE}${NC}"
    exit 1
fi
echo -e "  ${GREEN}PASSED: OpenAPI spec accessible (HTTP 200)${NC}"

# 5. WorkTwin Manifest Registry
echo -e "\n${YELLOW}[5/6] Verifying WorkTwin Fabric Manifests (/api/v1/worktwins/manifests)...${NC}"
TWIN_COUNT=$(curl -s -H "X-Tenant-ID: ${TENANT_ID}" "${API_BASE}/api/v1/worktwins/manifests" | grep -o 'twin_id' | wc -l || true)
echo -e "  RoleTwins detected: ${WHITE}${TWIN_COUNT}${NC}"
if [ "${TWIN_COUNT}" -lt 1 ]; then
    echo -e "  ${RED}FAILED: Zero WorkTwin manifests returned${NC}"
    exit 1
fi
echo -e "  ${GREEN}PASSED: WorkTwin Fabric manifests verified${NC}"

# 6. Future Boardroom & Gemini Live Dialogue
echo -e "\n${YELLOW}[6/6] Verifying Gemini Live Native Audio Dialogue (/api/v1/agents/live-dialogue)...${NC}"
AUDIO_RESP=$(curl -s -X POST "${API_BASE}/api/v1/agents/live-dialogue" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-ID: ${TENANT_ID}" \
    -d '{"message": "Welcome verification test", "model": "models/gemini-3.8-live", "voice_persona": "kore", "language": "en"}')
if [[ "${AUDIO_RESP}" == *"audio_base64"* ]]; then
    echo -e "  ${GREEN}PASSED: Gemini Live Native Audio generated successfully${NC}"
else
    echo -e "  ${RED}FAILED: Gemini Live dialogue failed to generate audio${NC}"
    exit 1
fi

echo -e "\n${GREEN}==========================================================${NC}"
echo -e "${GREEN}ALL SMOKE TESTS PASSED - PRODUCTION RELEASE VERIFIED 100%${NC}"
echo -e "${GREEN}==========================================================${NC}"
