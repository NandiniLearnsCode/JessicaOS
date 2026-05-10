# AGENTS.md

## Cursor Cloud specific instructions

JessicaOS is a legal AI platform with a Next.js frontend and Express backend. See `README.md` for standard setup commands.

### Services

| Service | Port | Command |
|---------|------|---------|
| Backend (Express) | 3001 | `npm run dev --prefix backend` |
| Frontend (Next.js) | 3000 | `npm run dev --prefix frontend` |

### Non-obvious notes

- The backend starts without Supabase or AI provider keys — routes return appropriate errors but the server runs fine. This makes local development possible without external services for UI work.
- The agent system uses **mock tool implementations** that return sample data, so the agent loop can be tested end-to-end once an AI provider key is set. Real Supabase/S3 integration replaces the mocks in `backend/src/lib/agent/tools.ts`.
- The frontend communicates with the backend via SSE (Server-Sent Events) for the agent run endpoint (`POST /agent/run`). The response streams agent steps in real time.
- Backend lint uses `prettier --check src/`. Frontend lint uses `eslint src/`.
- The frontend `.env.local` must set `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001` for local dev.
