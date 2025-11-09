# Project Overview
- Next.js App Router frontend that ingests a bank-statement PDF and sends it to Google Gemini via the Vercel AI SDK.
- Langsmith tracing wraps both parsing and categorization calls; no backend beyond `app/api/process-statement/route.ts`.
- State stays client-side; Tailwind drives UI styling; Zod shapes LLM responses.

# Commands
- `npm install` — install dependencies.
- `npm run dev` — start local development server on port 3000.
- `npm run lint` — run Next.js lint checks.
- `npm run build` — create production build.
- `npm run start` — serve the production build.

# Code Style Guidelines
- TypeScript strict mode; prefer explicit types for public APIs and shared data.
- Keep components small and colocate docs in matching `.md` files.
- Use Tailwind utility classes; avoid inline styles.
- Treat all amounts as numbers; incomes positive, expenses negative.
- Fetch-only API surface: `/api/process-statement` accepts `FormData` with `file`.

