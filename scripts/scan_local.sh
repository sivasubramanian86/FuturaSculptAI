#!/usr/bin/env bash
# FuturaSculptAI Comprehensive Local Quality & Security Scanner (Linux / macOS / Chromebook)
# Enforces 100% test coverage, zero linter errors, zero Bandit issues, and zero leaked credentials.

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}==========================================================${NC}"
echo -e "${CYAN}FuturaSculptAI - 100% Local Quality & Security Audit Gate${NC}"
echo -e "${CYAN}==========================================================${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

PYTHON_EXEC="python3"
if [ -f "${ROOT_DIR}/apps/api/.venv/bin/python" ]; then
    PYTHON_EXEC="${ROOT_DIR}/apps/api/.venv/bin/python"
elif [ -f "${ROOT_DIR}/apps/api/.venv/Scripts/python.exe" ]; then
    PYTHON_EXEC="${ROOT_DIR}/apps/api/.venv/Scripts/python.exe"
fi

# Gate 1: Secret Scan
echo -e "\n${YELLOW}[Gate 1/6] Running Local Credential & Secret Scanner...${NC}"
bash "${SCRIPT_DIR}/security_scan.sh"

# Gate 2: Ruff Check
echo -e "\n${YELLOW}[Gate 2/6] Running Ruff Linter on Backend...${NC}"
(cd "${ROOT_DIR}/apps/api" && "${PYTHON_EXEC}" -m ruff check .)
echo -e "  ${GREEN}PASSED: Ruff 0 errors, 100% clean.${NC}"

# Gate 3: Bandit Security Scan
echo -e "\n${YELLOW}[Gate 3/6] Running Bandit AST Security Scan on Backend...${NC}"
(cd "${ROOT_DIR}/apps/api" && "${PYTHON_EXEC}" -m bandit -r app)
echo -e "  ${GREEN}PASSED: Bandit 0 issues.${NC}"

# Gate 4: Pytest with 100% Coverage
echo -e "\n${YELLOW}[Gate 4/6] Running Pytest with 100% Branch Coverage...${NC}"
(cd "${ROOT_DIR}/apps/api" && "${PYTHON_EXEC}" -m pytest --cov=app --cov-branch --cov-report=term-missing --cov-fail-under=100)
echo -e "  ${GREEN}PASSED: Pytest 100.0% statement and branch coverage.${NC}"

# Gate 5: Frontend Vitest 100% Coverage
echo -e "\n${YELLOW}[Gate 5/6] Running Frontend Vitest 100% Coverage Suite...${NC}"
(cd "${ROOT_DIR}/apps/web" && npm run test:coverage)
echo -e "  ${GREEN}PASSED: Vitest 100.0% coverage.${NC}"

# Gate 6: Frontend Production Build
echo -e "\n${YELLOW}[Gate 6/6] Verifying Frontend Production Build...${NC}"
(cd "${ROOT_DIR}/apps/web" && npm run build)
echo -e "  ${GREEN}PASSED: Vite production build succeeded.${NC}"

echo -e "\n${GREEN}==========================================================${NC}"
echo -e "${GREEN}ALL GATES PASSED (100% Perfection Score across all suites)${NC}"
echo -e "${GREEN}==========================================================${NC}"
