# HCM AI · Project Management website

Programme dashboard for the HCM AI (formerly SAGIP) LGU HRIS build. Replaces the SAGIP Command Center Excel workbook with a live-data Next.js 15 app. Phase 1 MVP — static-JSON, single-user, seeded from the current SAGIP workbooks, one-click deploy to Vercel.

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
- Git
- A [Vercel](https://vercel.com) account for deploy (free tier is fine)

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev
# App at http://localhost:3000
# Health check at http://localhost:3000/api/health
```

No database. No environment variables required. No seed script. Data lives in `src/data/*.json` and is imported directly by each page.

## How to edit data

Every register the app renders is one JSON file under `src/data/`:

| File | Renders on |
| --- | --- |
| `milestones.json` | `/`, `/milestones`, `/timeline` |
| `critical-path.json` | `/timeline` |
| `objectives.json`, `key-results.json` | `/`, `/okrs` |
| `changes.json` | Phase 2 |
| `pocs.json`, `adrs.json` | `/` (recent ADRs), Phase 2 for full pages |
| `harness-defects.json` | Phase 2 |
| `dependencies.json` | Phase 2 |
| `risks.json` | `/risks` |
| `team.json` | `/team` |
| `standups.json` | `/standup` |
| `blockers.json` | `/`, `/blockers` |
| `agent-runs.json` | Phase 3 |
| `jira-tickets.json` | Phase 2 |
| `documents.json` | `/documents` |

Workflow to update anything on the site:

1. Edit the relevant JSON file under `src/data/`.
2. `git commit && git push`.
3. Vercel auto-redeploys in ~30 seconds. No migrations, no seed run.

TypeScript shapes for every JSON file are in [`src/types.ts`](src/types.ts). Dates are ISO strings (`"2027-01-15"`).

## When to add a database

**Phase 1 (now) — static JSON is enough.** The site is read-only for the team demo and for Project Owner tracking. Edits happen in the JSON files by whoever owns the workbook, then get committed. That's the whole workflow.

**Phase 2 — switch to Postgres if you need any of these:**

- Grade the OKRs in the browser and persist the change (`/okrs`).
- Add or resolve a blocker from the UI, not from a JSON edit (`/blockers`).
- Sync Jira tickets on a cron.
- Publish a weekly/monthly report page.

When that day comes, the shapes in `src/types.ts` are the target schema — see `Plan/HCM_AI_PM_Website_Spec.md` for the full Drizzle model and the migration path.

## Deploy to Vercel

1. Push this folder to a Git repo (GitHub, GitLab, or Bitbucket):
   ```bash
   git init
   git add .
   git commit -m "Phase 1 MVP: HCM AI PM website scaffold (static-JSON)"
   git branch -M main
   git remote add origin git@github.com:<org>/hcm-ai-pm.git
   git push -u origin main
   ```
2. In Vercel: **New Project** → import the repo.
3. Framework preset: **Next.js**. Root directory: `/`. Build & output settings: leave defaults.
4. **Environment Variables** (all optional):

   | Name | Value | Scope |
   | --- | --- | --- |
   | `NEXT_PUBLIC_APP_NAME` | `HCM AI · PM` (or your override) | Production, Preview |

5. Click **Deploy**. First build takes ~60 seconds.

That's it. No database provisioning, no seed step, no build-time secrets required.

## Environment variables

| Name | Phase | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | 1 | Brand text in the top bar. Optional; defaults to `HCM AI · PM`. |
| `DATABASE_URL` | 2 | Neon pooled connection string — required only when Phase 2 lands the writable OKR/blocker flow. |
| `ANTHROPIC_API_KEY` | 3 | Powers agents A1–A7. |
| `JIRA_API_TOKEN`, `JIRA_BASE_URL` | 2 | Jira Cloud REST sync. |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | 4 | Clerk auth (multi-tenant). |

## Scripts

| Script | What |
| --- | --- |
| `npm run dev` | Local dev server (Turbopack) at `http://localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (Next.js config) |

## Project layout

```
hcm-ai-pm/
├─ src/
│  ├─ app/               10 routes (see below)
│  ├─ components/        Sidebar, TopBar, cards, Gantt, table
│  ├─ data/              16 JSON files — the whole content model
│  ├─ lib/               env + utils
│  └─ types.ts           TypeScript shape for each JSON file
├─ package.json
├─ tsconfig.json
├─ tailwind.config.ts
└─ next.config.ts
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
| `/api/health` | JSON health check (lists loaded data files) |

## Phase 2 / 3 preview

**Phase 2 (2 weeks after Phase 1 ships):**

- Introduce Postgres (Neon) behind a `db()` helper; migrate JSON → tables one at a time.
- Jira sync (`*/15 * * * *` via Vercel Cron) into `jira_tickets`.
- New routes: `/changes`, `/pocs`, `/adrs`, `/harness`, `/dependencies`, `/reports/weekly`, `/reports/monthly`.
- OKR grade + blocker add/resolve become server actions.

**Phase 3 (3 weeks):**

- Anthropic SDK wired for A1 Planning, A2 Projections, A3 Reporting, A4 Escalation, A5 Actions, A6 Decisions, A7 Risks.
- Signing UI at `/agents/[agentId]/runs/[runId]`.
- Cron cadences from the Agent Plan §8.

**Phase 4 (2 weeks):**

- Clerk auth, org-per-LGU tenant, role mapping to Work Plan §11.
- Client-reader role sees only published monthly reports + Current documents.

## Troubleshooting

**Gantt bars all crammed on today** — milestone `targetDate` values in `src/data/milestones.json` are anchored to NTP = 2027-01-15. Edit the ISO strings once real NTP is issued.

**"KR grade doesn't save"** — expected in Phase 1. Grades are client-state only; edit `src/data/key-results.json` and redeploy to persist.

**A JSON edit didn't show up** — Vercel only redeploys on `git push`. If you edited locally, run `npm run dev` to see changes; if you edited a JSON on GitHub directly, wait ~30 seconds for the auto-deploy.

**TypeScript complains about a JSON field** — update the corresponding interface in `src/types.ts`. The JSON is the source of truth; types trail it.

## Contributing

- One JSON file = one register. Never split a register across multiple files.
- Every new page reads from `@/data/*.json` in Phase 1. No `fetch()` to third-party APIs from a page.
- Follow the Work Plan §8.2 change loop for anything non-trivial.

## License

Internal — Supervaise Engineering. Do not redistribute.
