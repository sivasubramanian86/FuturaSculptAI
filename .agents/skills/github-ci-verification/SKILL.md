---
name: github-ci-verification
description: Mandatory post-push workflow that monitors and verifies GitHub Actions CI/CD pipelines using the gh CLI, ensuring zero broken builds on master.
version: "1.0.0"
author: "FuturaSculptAI Platform Engineering"
allowed_tools:
  - run_command
---

# GitHub CI/CD Verification Skill

## Purpose
Enforces the mandatory post-push protocol: every commit pushed to GitHub must be actively verified through completion using the GitHub CLI (`gh`). If any workflow fails, the agent must inspect logs, identify the root cause, fix it, and re-verify until 100% green.

## Mandatory Execution Procedure

### Step 1: List Triggered Workflows
Immediately following any `git push origin <branch>`:
```powershell
gh run list --limit 3
```
Capture the run ID for `FuturaSculptAI CI & Quality Gate` and `Security Audit & Secret Scanning`.

### Step 2: Watch Workflow Execution
Stream workflow progress until conclusion:
```powershell
gh run watch <run_id>
```

### Step 3: Handle Failures Surgically
If status is `failure`:
```powershell
gh run view <run_id> --log-failed
```
1. Isolate the failing step:
   - Ruff linting violation
   - Bandit security AST finding
   - Pytest / Vitest coverage regression
   - Multi-stage Docker container build failure
2. Reproduce and fix locally.
3. Re-test locally with `100%` pass criteria.
4. Commit with Conventional Commits, push, and return to Step 1.

### Step 4: Verification Gate Sign-Off
Only conclude the task when `gh run list --limit 3` reports:
```
completed    success    <commit_message>    FuturaSculptAI CI & Quality Gate    master    push    ...
completed    success    <commit_message>    Security Audit & Secret Scanning    master    push    ...
```
