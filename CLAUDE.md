# CLAUDE.md

## Project

Family Goal Tracker — React + Express + PostgreSQL + MUI, deployed via Docker Compose. See PLAN.md and ARCHITECTURE.md for full details.

## Development Practices

- **TDD**: Write tests first, then implement to make them pass.
- **Feature branches**: Work in a feature branch, never commit directly to main.
- **Commit discipline**: Only commit when code is in a good, working state.
- **Push when green**: Only push to remote when all tests pass.
- **PRs when ready**: Push the feature branch to origin and open a PR. Never push directly to `main` — always merge via PR.
- **PR description**: Must include **what** changed and **why** (motivation/context). Use `gh pr create --title "..." --body "..."` with a Summary section (what) and a Motivation section (why).
- **PR reviewer**: Always assign `AyhamHuq` as reviewer via `gh pr create --reviewer AyhamHuq`.
- **PR review by Claude**: After opening, Claude runs `gh pr review <number> --comment -b "..."` with concise notes on logic, tests, and edge cases before merging.
