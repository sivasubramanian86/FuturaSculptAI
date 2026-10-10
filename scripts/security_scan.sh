#!/usr/bin/env bash
# FuturaSculptAI Local Secret Scanner (Linux / macOS / Chromebook)
# Scans source files for leaked credentials, private keys, or API tokens.

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

PATTERN='AIza[0-9A-Za-z-_]{35}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN.*PRIVATE KEY|password\s*=\s*["\x27][^"\x27]{6,}'

# Search with grep/ripgrep excluding node_modules, git, pycache, and documentation specs
HITS=$(grep -rEn --exclude-dir={node_modules,.git,__pycache__,coverage,dist,.venv} \
    --exclude="*.ps1" --exclude="*.sh" --exclude="SKILL.md" \
    --exclude="10_security_governance.md" --exclude="non-negotiables.md" \
    --include=\*.{py,ts,js,json,yaml,toml,md} -E "${PATTERN}" . 2>/dev/null || true)

if [ -n "${HITS}" ]; then
    echo -e "${RED}HITS DETECTED:${NC}"
    echo "${HITS}"
    exit 1
else
    echo -e "${GREEN}PASSED: Zero hardcoded secrets detected across source and config files.${NC}"
    exit 0
fi
