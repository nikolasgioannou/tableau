# CLAUDE.md

Guidelines for working on the Tableau codebase.

## Commands

- `bun dev` — start dev server
- `bun run lint` — eslint
- `bun run format:write` — prettier
- `bun run typecheck` — tsc --noEmit
- `bun run test` — vitest
- `bun run db:push` — push prisma schema to sqlite
- `bun run db:studio` — open prisma studio

## Architecture

- **Next.js Pages Router** with TypeScript. Not App Router.
- **tRPC** for type-safe API calls between client and server.
- **Prisma + SQLite** for persistence. Use `bun run db:push` (no migrations).
- **Vercel AI SDK v6** for streaming AI responses. The server owns chat history — the client does not send message history; the server loads it from the database.
- **Radix UI** for all interactive primitives. Never roll custom implementations when Radix has a solution.

## Design System

- All colors come from HSL design tokens in `src/styles/globals.css`. Never use hardcoded hex values.
- Light/dark mode via `.dark` class on `<html>`. Tokens: `--bg-primary`, `--fg-primary`, `--border`, `--accent`, etc.
- UI components live in `src/components/ui/`. Use them instead of raw HTML elements.
- No shadows anywhere. No focus rings/outlines (global `outline: none`).
- Focus states use `border-border-strong` instead of rings.
- Accent color (blue) is only for primary buttons. Menus and interactive items use neutral `bg-surface-raised` for hover/focus.
- Use Lucide icons — no inline SVGs.

## Slides

- Each slide has `head` (font links for `<head>`) and `body` (content for `<body>`).
- Tailwind CSS is loaded via CDN in every slide iframe.
- The AI is instructed to use Tailwind classes and flex layouts.
- `SlideFrame` renders slides in an iframe at 1280x720 with CSS transform scaling.

## AI Chat

- Chat endpoint: `POST /api/ai/slide-chat`
- Uses `streamText` with `smoothStream({ chunking: "word" })` for smooth streaming.
- Tool calls are persisted per-step (not lumped into one message) to maintain correct `tool_use` / `tool_result` pairing for the Anthropic API.
- The `onFinish` callback saves each step's tool calls as separate assistant messages, then the final text as its own message.
- Tool call IDs from the AI are preserved in `ChatToolCall.toolCallId`.

## Conventions

- Conventional commits (enforced by commitlint).
- Prettier for formatting, ESLint for linting.
- Pre-commit hooks via Lefthook: format + lint in parallel, then typecheck.
- Strict TypeScript — no `any`, no type errors.
- Tests in `src/__tests__/` using Vitest.
