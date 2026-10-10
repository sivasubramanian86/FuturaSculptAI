# FuturaSculptAI Local Secret Scanner
$ErrorActionPreference = "Continue"

$pattern = 'AIza[0-9A-Za-z-_]{35}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|-----BEGIN.*PRIVATE KEY|password\s*=\s*["\x27][^"\x27]{6,}'

$hits = Get-ChildItem -Path . -Recurse -Include "*.py","*.ts","*.js","*.json","*.yaml","*.toml","*.md" |
    Where-Object { 
        $_.FullName -notmatch "node_modules|\.git|__pycache__|\.venv|dist|coverage|security_scan\.ps1" -and
        $_.Name -ne "SKILL.md" -and $_.Name -ne "10_security_governance.md" -and $_.Name -ne "non-negotiables.md"
    } |
    Select-String -Pattern $pattern

if ($hits) {
    Write-Host "HITS DETECTED ($($hits.Count)):" -ForegroundColor Red
    foreach ($h in $hits) {
        Write-Host "$($h.Path):$($h.LineNumber) -> $($h.Line.Trim())"
    }
    exit 1
} else {
    Write-Host "PASSED: Zero hardcoded secrets detected across source and config files." -ForegroundColor Green
    exit 0
}
