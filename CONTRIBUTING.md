# Contributing to FuturaSculptAI

Thank you for contributing to **FuturaSculptAI**! This project was created for the **AI Builder Cup 2026** (Future of Work Track) and is engineered under enterprise standards.

---

## 1. Non-Negotiable Quality Gates

Before any pull request can be merged, all automated quality gates must achieve **100% success**:

1. **100% Test Coverage:**
   - Backend (`apps/api`): `pytest --cov=app --cov-branch --cov-fail-under=100` must pass with 100% statement and branch coverage.
   - Frontend (`apps/web`): `vitest run --coverage` must pass with 100% coverage.
   - No bypassing comments (`/* v8 ignore */` or `# pragma: no cover`) are permitted.

2. **Zero Linter & Security Findings:**
   - `ruff check .` -> 0 errors.
   - `bandit -r app` -> 0 issues.
   - Secret scan -> 0 detected credentials.

3. **Responsible AI Policy:**
   - Any scenario generation or scoring pathway must honor `docs/product/responsible-workforce-rules.md`.
   - Never implement automated termination or individual punitive algorithms.

4. **Git Repository Hygiene:**
   - Do **NOT** commit raw brainstorming drafts, blueprint docs, or binary `.pdf` files.
   - All documentation must be clean, structured Markdown in `docs/` or root directory.

---

## 2. Development Workflow

### Setup Local Environment

```bash
# 1. Backend setup
cd apps/api
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\Activate.ps1 on Windows
pip install -e ".[dev]"

# 2. Frontend setup
cd ../web
npm install
```

### Running Local Validation

```bash
# Automated local full scan
pwsh -NoProfile -ExecutionPolicy Bypass -File ./scripts/scan_local.ps1
```

---

## 3. Conventional Commit Guidelines

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat(scope): new user-facing capability`
- `fix(scope): bug fix with accompanying regression test`
- `test(scope): addition or refinement of test coverage`
- `docs(scope): updates to technical specifications or architecture`
- `refactor(scope): internal code restructuring with zero behavioral delta`
- `ci(scope): updates to GitHub Actions workflows or deployment scripts`

---

## 4. Pull Request Process

1. Fork the repository and create your feature branch: `git checkout -b feat/your-feature-name`.
2. Implement your changes using **Test-Driven Development (TDD)**: write failing tests first, then implement minimal code to pass.
3. Run `pwsh ./scripts/scan_local.ps1` and ensure every check passes with 100% compliance.
4. Open a Pull Request referencing the relevant issue and filling out `.github/pull_request_template.md`.
