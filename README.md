# Saffron

An AI-native product builder — from prompt to lifecycle documents, design directions, and a full-stack React app. Inspired by [Lovable.dev](https://lovable.dev) and [Aria](https://github.com/SSGutala/aria).

![Saffron](public/logo.svg)

## Features

### Core builder (Lovable-style)
- **Chat-to-app generation** — describe your app, AI generates React + Tailwind code
- **Live Sandpack preview** — interact with your app instantly in the browser
- **Code explorer** — browse generated files with syntax highlighting
- **Iterative edits** — chat to refine and extend your app
- **Image inspiration** — paste, drag, or upload reference images in prompts and edit boxes

### End-to-end product lifecycle (Aria-style)
1. **Prompt + inspiration images** — describe your product; paste screenshots or mood boards
2. **7 lifecycle artifacts** — intake summary, product brief, workflow map, data model, automation model, UX recommendation, app spec
3. **Editable artifacts** — Word-style docs (TipTap), Lucidchart-style diagrams (React Flow), spreadsheets, slides
4. **Export** — PDF, DOCX, XLSX, Markdown
5. **3 design directions** — live Sandpack previews; pick a style before building
6. **Full-stack app build** — chosen design + brief context drives code generation

### Platform
- **Project persistence** — SQLite via Prisma
- **Built-in auth** — email/password with JWT sessions
- **Usage credits** — rate-limited generation
- **Dark/light theme** — warm Saffron aesthetic

## Tech Stack

- **Next.js 15** + React 19 + TypeScript
- **Tailwind CSS v4** + shadcn/ui
- **tRPC** + TanStack Query
- **Prisma** + SQLite
- **Sandpack** — in-browser live preview
- **TipTap** — rich document editing
- **React Flow** — workflow/diagram editing
- **OpenAI** — generation (vision for image inspiration when API key is set)

## Quick Start

```bash
git clone https://github.com/SSGutala/Saffron.git
cd Saffron

npm install
cp .env.example .env
# Set AUTH_SECRET; optionally OPENAI_API_KEY for AI + vision

npm run db:push
npm run dev
```

Open [http://localhost:4321](http://localhost:4321)

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path, e.g. `file:./dev.db` |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL, e.g. `http://localhost:4321` |
| `AUTH_SECRET` | Yes | Random string for JWT sessions |
| `OPENAI_API_KEY` | Optional | Enables AI generation + image vision for inspiration |

**Demo mode:** Without an API key, the app uses rich demo content so you can test the full lifecycle flow locally.

## How It Works

```
Landing prompt (+ optional images)
        ↓
Enterprise brief pipeline → 7 artifacts (docs, diagram, sheets…)
        ↓
User edits / approves stages in Files tab
        ↓
Generate 3 design previews (Sandpack)
        ↓
Pick style → full app code generation → live preview
        ↓
Chat to iterate on the built app
```

## Architecture

- `src/lib/lifecycle/` — brief pipeline, style previews, orchestrator
- `src/modules/artifacts/` — artifact CRUD, editors, export
- `src/modules/lifecycle/` — lifecycle tRPC + UI cards
- `src/components/prompt-with-images.tsx` — shared image paste/upload widget
- `src/lib/code-agent.ts` — Sandpack React app generation

## License

MIT
