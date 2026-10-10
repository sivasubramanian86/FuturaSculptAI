#!/usr/bin/env bash
# FuturaSculptAI Local Environment Bootstrap Script (Linux / macOS / Chromebook)
# Automatically sets up Python (uv / poetry / venv) and Node.js dependencies.

set -euo pipefail

# ANSI Color Codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}==========================================================${NC}"
echo -e "${CYAN}FuturaSculptAI - Local Environment Setup & Bootstrap${NC}"
echo -e "${CYAN}==========================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

# 1. Check Prerequisites
echo -e "\n${YELLOW}[Step 1/5] Checking System Prerequisites...${NC}"

PYTHON_BIN=""
if command -v python3 &>/dev/null; then
    PYTHON_BIN="python3"
elif command -v python &>/dev/null; then
    PYTHON_BIN="python"
else
    echo -e "${RED}ERROR: Python is not installed. Python 3.12+ is required.${NC}"
    exit 1
fi

PY_VERSION=$("${PYTHON_BIN}" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")')
echo -e "  ${GREEN}Found Python: ${PY_VERSION} ($(command -v "${PYTHON_BIN}"))${NC}"

if ! command -v node &>/dev/null || ! command -v npm &>/dev/null; then
    echo -e "${RED}ERROR: Node.js and npm are required. Please install Node.js 20+.${NC}"
    exit 1
fi
echo -e "  ${GREEN}Found Node.js: $(node -v) / npm $(npm -v)${NC}"

# 2. Setup Environment Variables (.env)
echo -e "\n${YELLOW}[Step 2/5] Configuring Environment Variables...${NC}"
if [ ! -f "${ROOT_DIR}/.env" ]; then
    if [ -f "${ROOT_DIR}/.env.example" ]; then
        cp "${ROOT_DIR}/.env.example" "${ROOT_DIR}/.env"
        echo -e "  ${GREEN}Created .env from .env.example${NC}"
    else
        cat <<EOF > "${ROOT_DIR}/.env"
ENVIRONMENT=local
GCP_PROJECT_ID=genai-apac-2026-491004
VERTEX_AI_LOCATION=asia-southeast1
EOF
        echo -e "  ${GREEN}Created minimal .env configuration${NC}"
    fi
else
    echo -e "  ${GREEN}.env already exists. Preserving existing configuration.${NC}"
fi

# 3. Setup Python Backend Environment (uv -> poetry -> standard venv)
echo -e "\n${YELLOW}[Step 3/5] Setting up Backend Environment (apps/api)...${NC}"
cd "${ROOT_DIR}/apps/api"

if command -v uv &>/dev/null; then
    echo -e "  ${CYAN}Detected 'uv' (Fast Python package manager)!${NC}"
    echo "  Creating virtual environment with uv..."
    uv venv .venv
    echo "  Installing dependencies via uv pip..."
    uv pip install -e ".[dev]"
    echo -e "  ${GREEN}Backend dependencies installed successfully with uv.${NC}"
elif command -v poetry &>/dev/null; then
    echo -e "  ${CYAN}Detected 'poetry'!${NC}"
    echo "  Installing dependencies via poetry..."
    poetry install
    echo -e "  ${GREEN}Backend dependencies installed successfully with poetry.${NC}"
else
    echo "  Using standard Python venv and pip..."
    if [ ! -d ".venv" ]; then
        "${PYTHON_BIN}" -m venv .venv
    fi
    # Activate virtualenv
    # shellcheck disable=SC1091
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -e ".[dev]"
    echo -e "  ${GREEN}Backend dependencies installed successfully with pip.${NC}"
fi

# 4. Setup Frontend Web Environment
echo -e "\n${YELLOW}[Step 4/5] Setting up Frontend Cockpit (apps/web)...${NC}"
cd "${ROOT_DIR}/apps/web"
echo "  Installing npm dependencies in apps/web..."
npm install
echo -e "  ${GREEN}Frontend dependencies installed successfully.${NC}"

# 5. Sanity Verification Probe
echo -e "\n${YELLOW}[Step 5/5] Verifying Installation Sanity...${NC}"
cd "${ROOT_DIR}/apps/api"
VENV_PY="${ROOT_DIR}/apps/api/.venv/bin/python"
if [ ! -f "${VENV_PY}" ]; then
    VENV_PY="${PYTHON_BIN}"
fi

"${VENV_PY}" -c "import fastapi, pydantic, networkx; print('  Backend imports verified: FastAPI, Pydantic, NetworkX OK')"

echo -e "\n${GREEN}==========================================================${NC}"
echo -e "${GREEN}SETUP COMPLETE! Ready to build and run.${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo -e "To launch local cockpit (Backend + Frontend):"
echo -e "  ${CYAN}./scripts/run_local.sh${NC}"
echo -e "\nTo run full quality and security audit:"
echo -e "  ${CYAN}./scripts/scan_local.sh${NC}"
echo -e "${GREEN}==========================================================${NC}"
