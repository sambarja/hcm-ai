# Stage A — Provision Vercel Postgres

The app runs in one of two modes:

- **Local storage mode** — per-device, browser localStorage. This is the default. A yellow banner shows on every page.
- **Database mode** — Vercel Postgres, shared across every signed-in user. A blue banner shows once, offering to upload existing local data.

The switch is automatic. When the `POSTGRES_URL` environment variable is set on Vercel, the app enters database mode on the next request. No code change needed.

## What Sam does (2 clicks in Vercel)

1. Open [vercel.com/dashboard](https://vercel.com/dashboard) → select the `hcm-ai` project.
2. Go to the **Storage** tab → click **Create Database** → pick **Postgres** (Neon-backed). Free tier is fine to start.
3. Click **Connect Project** on the new database and select `hcm-ai`. Vercel auto-injects these env vars:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`
4. Trigger a redeploy (Vercel does this automatically after env-var changes, but if not: Deployments → latest → Redeploy).

That's it. On the next request:

- The `/api/store` endpoint sees `POSTGRES_URL` and switches to database mode.
- The schema is applied idempotently on first request (see `src/lib/db/client.ts:ensureSchema`).
- Every signed-in user sees a blue banner with **Upload my local data to the server** if their browser has any tasks / minutes / concerns filed while in local mode.

## Verifying it worked

After deploy:

1. Sign in on the deployed URL. If the yellow banner is gone → database mode is on.
2. Add a task from your browser → open the site from a phone (or another browser) → sign in → task should appear.
3. Ask a teammate to sign in from their device — same task should be visible.

## Reverting (if needed)

Delete the Postgres integration from **Storage** in the Vercel dashboard. The env vars go with it. The app falls back to local-storage mode on the next request. No data is deleted from any browser.

## Local development against the DB

For local dev with the real Postgres:

```bash
vercel env pull .env.development.local
npm run dev
```

Without `.env.development.local`, `npm run dev` runs in local-storage mode — safe for UI work.

## Cost note

Vercel Postgres free tier is 60 compute-hours/month. For an 8-person team filing tasks and minutes, expected usage is well under 5 hours/month. Upgrade to a paid tier only if real client load is added.

## Schema

Full SQL is in `src/lib/db/schema.sql`. It's applied automatically by `ensureSchema()` on first request; you can also run it manually from the Vercel Postgres query console if you prefer to inspect it first.

Tables:

- `tasks` — every task; comments and change log are separate tables joined on `task_id`.
- `task_comments` — attributed comments.
- `task_change_log` — status transitions + field edits.
- `meetings` — one row per Monday, unique on `meeting_date`.
- `concerns` — raised concerns with leadership response fields.
- `milestone_overrides` — Admin-set live status/RAG.
- `okr_grades` — Admin-set live KR grades.
- `document_overrides` — extra links + description on any document card.
