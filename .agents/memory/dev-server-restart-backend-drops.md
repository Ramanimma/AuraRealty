---
name: Backgrounded tsx+vite restart drops backend
description: Why killing tsx/vite by name and re-running npm run dev can leave the Express API down in this repo's dev setup
---

This project's dev workflow runs `npx tsx server/index.ts & vite --port 5000 --host 0.0.0.0` as one shell command (backend backgrounded with `&`, frontend in foreground).

Running `pkill -f "tsx"; pkill -f "vite"; sleep 2 && npm run dev` (or an equivalent manual restart) can kill the parent shell that owns the backgrounded `tsx` process without it restarting reliably — Vite tends to come back, but the Express backend on port 3001 can stay down, causing `ECONNREFUSED` / empty API responses that look like data loss but are just the backend being offline.

**Why:** the `&` backgrounding ties the tsx process's lifecycle to the parent shell invocation; ad-hoc pkill + re-run doesn't always re-establish both processes under the workflow's supervision.

**How to apply:** after any manual restart of this dev setup, verify both processes are actually up — `curl localhost:3001/<some-api-route>` and the frontend — before concluding the restart worked. If the backend didn't come back, use the `restart_workflow` tool (which properly supervises both processes) instead of manual pkill/npm run dev.
