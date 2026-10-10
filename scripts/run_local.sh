#!/usr/bin/env bash
# FuturaSculptAI Local Development Runner (Linux / macOS / Chromebook)
# Launches both FastAPI backend and React frontend concurrently.

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
WHITE='\033[1;37m'
NC='\033[0m'

echo -e "${CYAN}==========================================${NC}"
echo -e "${CYAN}FuturaSculptAI - Local Cockpit Launcher${NC}"
echo -e "${CYAN}==========================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

API_PORT=8000
WEB_PORT=5173

# Python virtual environment detection
PYTHON_EXEC="python3"
if [ -f "${ROOT_DIR}/apps/api/.venv/bin/python" ]; then
    PYTHON_EXEC="${ROOT_DIR}/apps/api/.venv/bin/python"
elif [ -f "${ROOT_DIR}/apps/api/.venv/Scripts/python.exe" ]; then
    PYTHON_EXEC="${ROOT_DIR}/apps/api/.venv/Scripts/python.exe"
fi

echo -e "${GREEN}Starting FastAPI Backend on port ${API_PORT}...${NC}"
(cd "${ROOT_DIR}/apps/api" && "${PYTHON_EXEC}" -m uvicorn app.main:app --host 0.0.0.0 --port "${API_PORT}" --reload) &
API_PID=$!

echo -e "${GREEN}Starting React + Vite Frontend on port ${WEB_PORT}...${NC}"
(cd "${ROOT_DIR}/apps/web" && npm run dev) &
WEB_PID=$!

cleanup() {
    echo -e "\n${YELLOW}Shutting down FuturaSculptAI services...${NC}"
    kill "${API_PID}" 2>/dev/null || true
    kill "${WEB_PID}" 2>/dev/null || true
    wait "${API_PID}" 2>/dev/null || true
    wait "${WEB_PID}" 2>/dev/null || true
    echo -e "${GREEN}All services stopped cleanly.${NC}"
}

trap cleanup SIGINT SIGTERM EXIT

echo -e "\n${YELLOW}FuturaSculptAI Cockpit running:${NC}"
echo -e "  Frontend: ${WHITE}http://localhost:${WEB_PORT}${NC}"
echo -e "  Backend:  ${WHITE}http://localhost:${API_PORT}${NC}"
echo -e "  API Docs: ${WHITE}http://localhost:${API_PORT}/docs${NC}"
echo -e "\nPress Ctrl+C to stop all servers."

wait
