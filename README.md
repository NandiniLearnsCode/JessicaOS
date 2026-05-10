# JessicaOS

AI-powered legal platform with multi-step agent capabilities. Inspired by [Mike](https://github.com/willchen96/mike).

## Contents

- `frontend/` - Next.js application
- `backend/` - Express API with AI agent system, document processing, and database schema
- `backend/schema.sql` - Supabase schema for fresh databases

## Prerequisites

- Node.js 20 or newer
- npm
- A Supabase project (for auth and database)
- An S3-compatible bucket (Cloudflare R2, MinIO, etc.)
- At least one AI model provider API key: Anthropic, Google Gemini, or OpenAI

## Setup

### 1. Install dependencies

```bash
npm install --prefix backend
npm install --prefix frontend
```

### 2. Create env files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Fill in the values (see [Environment Variables](#environment-variables)).

### 3. Run the database schema

For a new Supabase database, open the SQL editor and run `backend/schema.sql`.

### 4. Start the backend

```bash
npm run dev --prefix backend
```

Backend runs on `http://localhost:3001`.

### 5. Start the frontend

```bash
npm run dev --prefix frontend
```

Open `http://localhost:3000`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Notes |
| --- | --- |
| `PORT` | Defaults to `3001` |
| `FRONTEND_URL` | `http://localhost:3000` for local dev |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Supabase service role key |
| `R2_ENDPOINT_URL` | S3-compatible endpoint |
| `R2_ACCESS_KEY_ID` | Object storage access key |
| `R2_SECRET_ACCESS_KEY` | Object storage secret key |
| `R2_BUCKET_NAME` | Object storage bucket name |
| `ANTHROPIC_API_KEY` | Optional Anthropic key |
| `GEMINI_API_KEY` | Optional Google Gemini key |
| `OPENAI_API_KEY` | Optional OpenAI key |

### Frontend (`frontend/.env.local`)

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon key |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:3001` for local dev |

## Useful Checks

```bash
npm run build --prefix backend
npm run build --prefix frontend
npm run lint --prefix frontend
npm run lint --prefix backend
```

## Architecture

### AI Agent System

JessicaOS features a multi-step AI agent that can chain tool calls to complete complex legal workflows:

- **Multi-provider support**: Anthropic Claude, Google Gemini, OpenAI
- **8 built-in tools**: search, read, create, edit, extract table, list, summarize, compare documents
- **Streaming SSE**: Real-time step-by-step progress via Server-Sent Events
- **Agent loop**: Plan → Execute → Observe → Repeat (up to 10 steps)

## License

AGPL-3.0-only
