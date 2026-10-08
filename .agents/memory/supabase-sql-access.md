---
name: Supabase direct SQL access
description: Why direct SQL execution against this project's Supabase Postgres database is not possible from the Replit agent environment, and the recommended alternative.
---

Direct SQL execution against this project's Supabase Postgres database is **not possible from the Replit agent environment**. The hostname `db.<project-ref>.supabase.co` does not resolve inside the container, and `psql` / the Supabase CLI (`supabase db query --db-url`) both fail with connection/DNS errors.

**Why:** The Replit environment only reaches Supabase via the HTTPS REST API (`https://<project-ref>.supabase.co`) used by `@supabase/supabase-js`. The direct Postgres port (5432) and connection pooler port (6543) are not reachable.

**How to apply:** For any Supabase DDL (adding columns, altering tables, etc.), run the provided SQL in the Supabase SQL Editor instead of trying to run it from agent tools. After running the SQL, the app code can read and write the new columns via the Supabase JS client as normal.
