# Tableau

AI-powered presentation builder. Describe what you want and the AI builds it — slide by slide, with full design consistency.

## Stack

- **Framework:** Next.js (Pages Router), TypeScript, Tailwind CSS
- **API:** tRPC, Vercel AI SDK (Anthropic Claude)
- **Database:** Prisma + SQLite
- **UI:** Radix UI primitives, CodeMirror, Lucide icons
- **Runtime:** Bun

## Getting Started

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env

# Push database schema
bun run db:push

# Start dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  components/
    ui/           # Design system (Button, Dialog, Select, Tabs, etc.)
    editor/       # Editor components (ChatPanel, SlidePreview, SlideStrip, etc.)
    layout/       # AppShell, Sidebar
    slide-frame.tsx  # Iframe-based slide renderer
  pages/
    presentations/   # List + editor pages
    settings.tsx     # Theme settings
    api/
      ai/            # AI chat endpoint (streaming)
      export/        # PDF export via Puppeteer
      upload.ts      # Image upload
      trpc/          # tRPC handler
  server/
    api/routers/     # tRPC routers (presentation, slide, chat)
  hooks/             # useTheme
  lib/               # cn utility, AI client
  styles/            # Design tokens (HSL-based, light/dark)
```

## Key Concepts

- **Slides** have a `head` (font links, etc.) and `body` (visible content). Tailwind CSS is loaded via CDN in every slide iframe.
- **Chat** is persisted to the database. The AI has tools to create, update, delete, and reorder slides. Tool calls are stored per-step to maintain correct message ordering.
- **Streaming** uses the AI SDK's `smoothStream` for word-by-word output. Slide previews update in real-time as the AI executes tools.

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start dev server (Turbopack) |
| `bun run build` | Production build |
| `bun run db:push` | Push Prisma schema to database |
| `bun run db:studio` | Open Prisma Studio |
| `bun run lint` | Run ESLint |
| `bun run format:write` | Run Prettier |
| `bun run typecheck` | Run TypeScript checks |
| `bun run test` | Run Vitest tests |
