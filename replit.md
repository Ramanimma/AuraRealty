# Texas Realty Hub

A real estate website for the Austin, TX market built with React, Vite, and TypeScript. Features property listings, agent profile, testimonials, and an admin dashboard.

## Architecture

- **Frontend**: React 18 + Vite + TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Express.js server (`server/index.ts`) running on port 3001
- **Database/Auth**: Supabase (hosted) — handles auth, database, and storage
- **Dev setup**: Vite frontend (port 5000) proxies `/api` requests to Express (port 3001)

## Running the App

```bash
npm run dev
```

This starts both the Express API server (port 3001) and the Vite dev server (port 5000) concurrently.

## Key Files

- `server/index.ts` — Express API server with public and admin-protected routes
- `src/lib/api.ts` — Frontend API client (replaces direct Supabase calls)
- `src/integrations/supabase/client.ts` — Supabase client (auth only on frontend)
- `vite.config.ts` — Vite config with `/api` proxy to Express
- `supabase/migrations/` — Database schema migrations (run on Supabase project)

## Environment Variables

Required in `.env`:
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key

Optional (for enhanced server-side security):
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (for admin operations bypassing RLS)

## API Routes

### Public
- `GET /api/listings` — All property listings
- `GET /api/listings/:id` — Single listing
- `GET /api/agent-profile` — Agent profile
- `GET /api/reviews` — Approved reviews only
- `POST /api/reviews` — Submit a review
- `GET /api/admin-exists` — Check if admin user exists

### Admin (requires Bearer token)
- `GET/POST/PATCH/DELETE /api/admin/listings/:id`
- `GET/PATCH/DELETE /api/admin/reviews/:id`
- `GET/POST/PATCH /api/admin/agent-profile/:id`

## Pages

- `/` — Home page (listings, testimonials, contact form)
- `/property/:id` — Property detail page
- `/admin` — Admin login
- `/admin/dashboard` — Admin dashboard (listings, profile, review moderation)
- `/home-valuation` — Home valuation request form
- `/reset-password` — Password reset

## User Preferences

- Make one change at a time and show the result before proceeding
- Do not restructure the project, add new dependencies, or change config files unless explicitly asked

## Dependencies Added During Migration

- `express` + `cors` — API server
- `dotenv` — Load `.env` in server context
- `tsx` — TypeScript runner for the Express server
- `concurrently` — Run server + Vite simultaneously
