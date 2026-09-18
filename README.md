# HCM AI · Project Management website

Programme dashboard for the HCM AI (formerly SAGIP) LGU HRIS build. Replaces the SAGIP Command Center Excel workbook with a live-data Next.js 15 app backed by Neon Postgres. Phase 1 MVP — single-user, seeded from the current SAGIP workbooks, deployable to Vercel today.

Governs:

- 6 milestones (M0–M5) + rehearsal (MR) from the Product Development Work Plan
- 10 critical-path and slack tasks (Work Plan §5)
- 5 objectives / 21 KRs from the Project Owner Pre-M1 OKR
- 10 failure modes from Work Plan §9.1
- Blocker register (KR 4.4), written stand-up log, team directory, document index

Phase 2 adds Jira sync, POC/ADR/harness pages, and weekly/monthly report renderers.
Phase 3 adds the seven AI agents from the Project Owner AI Agent Plan.
Phase 4 adds Clerk auth and multi-tenant scoping.

Full technical spec: [`HCM_AI_PM_Website_Spec.md`](../Plan/HCM_AI_PM_Website_Spec.md)

## Prerequisites

- Node.js 20 LTS or newer (Node 22 recommended)
- npm 10+
- A [Neon](https://neon.tech) account (free tier is fine)
- A [Vercel](https://vercel.com) account (free tier is fine)
- Git

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in DATABASE_URL
cp .env.example .env
# Edit .env — paste the pooled connection string from Neon dashboard

# 3. Push the schema to Neon
npm run db:push

# 4. Seed the database (idempotent)
npm run db:seed

# 5. Run dev server
npm run dev
# App at http://localhost:3000
# Health check at http://localhost:3000/api/health
```

If `db:push` prompts about destructive statements, review and confirm. Schema is Phase 1 stable — every table is additive.

## Deploy to Vercel

1. Push this folder to a Git repo (GitHub, GitLab, or Bitbucket):
   ```bash
   git init
   git add .
   git commit -m "Phase 1 MVP: HCM AI PM website scaffold"
   git branch -M main
   git remote add origin git@github.com:<org>/hcm-ai-pm.git
   git push -u origin main
   ```
2. In Vercel: **New Project** → import the repo.
3. Framework preset: **Next.js**. Root directory: `/`. Build & output settings: leave defaults.
4. **Environment Variables**:

   | Name | Value | Scope |
   | --- | --- | --- |
   | `DATABASE_URL` | Neon pooled connection string | Production, Preview |
   | `NEXT_PUBLIC_APP_NAME` | `HCM AI · PM` (or your override) | Production, Preview |

5. Click **Deploy**. First build takes ~90 seconds.

## Post-deploy

The DB has already been pushed and seeded locally (against the same Neon database that production uses). If you want a separate production database:

```bash
# Point .env at the production Neon URL locally, then:
npm run db:push
npm run db:seed
# Return .env to the dev URL
```

Verify:

```bash
curl https://<your-app>.vercel.app/api/health
# {"ok":true,"db":"connected","rows":1}
```

Then open the deployed URL and click through: `/`, `/timeline`, `/okrs`, `/milestones`, `/blockers`, `/risks`, `/standup`, `/team`, `/documents`.

## Environment variables

| Name | Phase | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | 1 | Neon pooled connection string (`?sslmode=require`) |
| `NEXT_PUBLIC_APP_NAME` | 1 | Brand text in the top bar |
| `ANTHROPIC_API_KEY` | 3 | Powers agents A1–A7 |
| `JIRA_API_TOKEN` | 2 | Jira Cloud REST API token |
| `JIRA_BASE_URL` | 2 | e.g. `https://supervaise.atlassian.net` |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | 4 | Clerk auth (multi-tenant) |

## Scripts

| Script | What |
| --- | --- |
| `npm run dev` | Local dev server (Turbopack) at `http://localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (Next.js config) |
| `npm run db:generate` | Emit SQL migration files from the Drizzle schema |
| `npm run db:push` | Sync the schema to the database (dev-fast) |
| `npm run db:seed` | Seed all tables from `src/db/seed.ts` |

## Project layout

```
hcm-ai-pm/
├─ src/
│  ├─ app/               10 routes (see below)
│  ├─ components/        Sidebar, TopBar, cards, Gantt, table
│  ├─ lib/               db client, env, utils
│  └─ db/                schema.ts + seed.ts (16 tables)
├─ drizzle/              generated migrations
├─ package.json
├─ tsconfig.json
├─ tailwind.config.ts
├─ next.config.ts
└─ drizzle.config.ts
```

## Routes (Phase 1)

| Route | What it shows |
| --- | --- |
| `/` | Dashboard — KR RAG counts, days to M1, upcoming milestones, recent decisions, aging blockers |
| `/timeline` | SVG Gantt for milestones + critical-path tasks over 12 months |
| `/milestones` | M0–M5 + MR cards with deliverable / oracle / exit |
| `/okrs` | 5-objective / 21-KR grid; grade editable client-side (no persist in P1) |
| `/blockers` | KR 4.4 blocker register; aging > 2 working days highlighted red |
| `/risks` | 10 failure modes from Work Plan §9.1 |
| `/standup` | Written stand-up log, grouped by date |
| `/team` | Team directory (5 members) |
| `/documents` | 7-section index; file paths open via `file://` |
| `/api/health` | JSON health check |

## Phase 2 / 3 preview

**Phase 2 (2 weeks after Phase 1 ships):**

- Jira sync (`*/15 * * * *` via Vercel Cron) into `jira_tickets`
- New routes: `/changes`, `/pocs`, `/adrs`, `/harness`, `/dependencies`, `/reports/weekly`, `/reports/monthly`
- Report pages initially render human-authored markdown seeded into `agent_runs`

**Phase 3 (3 weeks):**

- Anthropic SDK wired for A1 Planning, A2 Projections, A3 Reporting, A4 Escalation, A5 Actions, A6 Decisions, A7 Risks
- Signing UI at `/agents/[agentId]/runs/[runId]`
- Cron cadences from the Agent Plan §8

**Phase 4 (2 weeks):**

- Clerk auth, org-per-LGU tenant, role mapping to Work Plan §11
- Client-reader role sees only published monthly reports + Current documents

## Troubleshooting

**`Error: DATABASE_URL is required`** — copy `.env.example` to `.env` and paste your Neon pooled string.

**`db:push` fails with `SSL required`** — ensure your `DATABASE_URL` ends with `?sslmode=require`.

**`db:seed` reports zero inserts on second run** — that's normal. All inserts use `onConflictDoNothing()`; running it twice is safe.

**Vercel build fails on `next build`** — verify `DATABASE_URL` is set as a build-time env var (Vercel: Settings → Environment Variables → Production).

**Gantt bars don't render** — the seed anchors milestones to `NTP = 2027-01-15`. Change the `NTP` constant in `src/db/seed.ts` and re-run `db:seed` once actual NTP is issued.

**"KR grade doesn't save"** — expected in Phase 1. Grades are client-state only until Phase 2 wires a server action.

## Contributing

- Every schema change is a Drizzle migration: `npm run db:generate` then commit the emitted files under `drizzle/`.
- Every new page reads from Drizzle. No `fetch()` to third-party APIs from a page in Phase 1.
- Follow the Work Plan §8.2 change loop for anything non-trivial.

## License

Internal — Supervaise Engineering. Do not redistribute.
