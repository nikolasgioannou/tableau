# Contributing to Tableau

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

1. **Fork and clone** the repository
2. **Install dependencies:**
   ```bash
   bun install
   ```
3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Add your ANTHROPIC_API_KEY
   ```
4. **Push database schema:**
   ```bash
   bun run db:push
   ```
5. **Start the dev server:**
   ```bash
   bun dev
   ```

## Development Workflow

- Run `bun run lint` to check for lint errors
- Run `bun run typecheck` to verify types
- Run `bun run test` to run tests
- Run `bun run format:write` to format code

Pre-commit hooks (via Lefthook) will run formatting, linting, and typechecking automatically.

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/). Commit messages are validated by commitlint.

Examples:
- `feat: add slide reordering`
- `fix: resolve streaming race condition`
- `refactor: extract slide tools into module`
- `docs: update README setup instructions`
- `chore: update dependencies`

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear, atomic commits
3. Ensure all checks pass (`bun run lint && bun run typecheck && bun run test`)
4. Open a PR with a clear description of what changed and why

## Code Style

- **TypeScript** — strict mode, no `any` types
- **Prettier** for formatting
- **ESLint** for linting
- **Radix UI** for interactive primitives
- **Lucide** for icons
- All colors from design tokens — no hardcoded values
- See [CLAUDE.md](./CLAUDE.md) for detailed architecture and conventions
