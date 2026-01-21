# Repository Guidelines

## Project Structure & Module Organization
- `README.md` provides the project overview.
- `AGENTS.md` documents contributor expectations.
- No `src/`, `tests/`, or asset directories are present yet. When adding code, group it by domain in `src/` (e.g., `src/core/`, `src/ui/`) and place tests in `tests/` (e.g., `tests/core/`).

## Build, Test, and Development Commands
- No build, test, or runtime commands are defined in this repository yet.
- When you introduce a build system, document the primary commands here. Example:
  - `npm run build` - produce production artifacts.
  - `npm test` - run the test suite.

## Coding Style & Naming Conventions
- There are no enforced formatting or linting tools yet.
- Use consistent indentation (2 spaces for JS/TS, 4 spaces for Python) unless a tool enforces otherwise.
- Prefer clear, descriptive names (e.g., `UserProfile`, `fetch_user_profile`).

## Testing Guidelines
- No testing framework is configured yet.
- When tests are introduced, name files with a consistent pattern such as `*.test.*` or `test_*.py` and keep unit tests close to the modules they cover.

## Commit & Pull Request Guidelines
- Git history currently contains a single commit, so no commit message convention is established.
- Use short, imperative commit messages (e.g., "Add initial API client").
- Pull requests should include a concise description, a list of changes, and any relevant setup or testing notes.

## Configuration & Security Notes
- Avoid committing secrets or local environment files (e.g., `.env`).
- Document required configuration in the README or a dedicated `docs/` page when introduced.
