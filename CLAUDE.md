# CLAUDE.md

## Project

Family Goal Tracker — React + Express + PostgreSQL + MUI, deployed via Docker Compose. See PLAN.md and ARCHITECTURE.md for full details.

## Development Practices

- **TDD**: Write tests first, then implement to make them pass.
- **Feature branches**: Work in a feature branch, never commit directly to main.
- **Commit discipline**: Only commit when code is in a good, working state.
- **Push when green**: Only push to remote when all tests pass.
- **PRs when ready**: Push the feature branch to origin and open a PR with a description. Never push directly to `main` — always merge via PR.
- **PR review**: After opening a PR, Claude reviews it (checks logic, tests, edge cases) and leaves concise inline notes before merging.
