# CLAUDE.md

## Project

Family Goal Tracker — React + Express + PostgreSQL + MUI, deployed via Docker Compose on Hetzner CX23. See PLAN.md for implementation phases and ARCHITECTURE.md for schema, API shapes, and frequency math.

## GitHub Bot Identity

All GitHub operations (push, PR creation, PR review) must use the `goals-claude-bot` GitHub App token so that AyhamHuq can review and merge Claude's PRs.

- **Get a token**: `node scripts/github-app-token.mjs` (reads the `.pem` from repo root, App ID 3283225)
- **`gh` commands**: prefix with `GITHUB_TOKEN=$(node scripts/github-app-token.mjs)`, e.g.:
  ```
  GITHUB_TOKEN=$(node scripts/github-app-token.mjs) gh pr create ...
  GITHUB_TOKEN=$(node scripts/github-app-token.mjs) gh pr review ...
  ```
- **`git push`**: the local credential helper is already configured — just run `git push` normally and it will authenticate as the bot
- **Commit identity**: local git config is set to `goals-claude-bot[bot]` — no action needed

## Development Practices

- **TDD**: Write tests first, then implement to make them pass.
- **Feature branches**: Work in a feature branch, never commit directly to main.
- **Commit discipline**: Only commit when code is in a good, working state.
- **Push when green**: Only push to remote when all tests pass.
- **PRs when ready**: Push the feature branch to origin and open a PR with a description. Never push directly to `main` — always merge via PR.
- **PR description**: Must include **what** changed and **why** (motivation/context). Use `gh pr create --title "..." --body "..."` with a Summary section (what) and a Motivation section (why).
- **PR reviewer**: Always assign `AyhamHuq` as reviewer via `gh pr create --reviewer AyhamHuq`.
- **PR review by Claude**: After opening, Claude runs `gh pr review <number> --comment -b "..."` with concise notes on logic, tests, and edge cases before merging.
- **Docs**: Update README.md, PLAN.md, and ARCHITECTURE.md whenever endpoints, schema, services, or deployment config change. Docs live alongside the code — stale docs are bugs.
