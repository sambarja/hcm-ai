-- HCM AI PM · Stage A schema
-- Applied idempotently by /api/db/init on first request when USE_DB is on.
-- Run it manually from the Vercel Postgres query console if you prefer.

CREATE TABLE IF NOT EXISTS tasks (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  owner_id       TEXT NOT NULL,
  owner_name     TEXT NOT NULL,
  status         TEXT NOT NULL,
  milestone      TEXT NOT NULL,
  drive_link     TEXT,
  jira_link      TEXT,
  critical_path  BOOLEAN NOT NULL DEFAULT FALSE,
  created_by     TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_comments (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author     TEXT NOT NULL,
  author_id  TEXT NOT NULL,
  text       TEXT NOT NULL,
  at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_change_log (
  id           TEXT PRIMARY KEY,
  task_id      TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor        TEXT NOT NULL,
  actor_id     TEXT NOT NULL,
  from_status  TEXT,
  to_status    TEXT,
  note         TEXT,
  at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meetings (
  id            TEXT PRIMARY KEY,
  meeting_date  DATE NOT NULL UNIQUE,
  chair         TEXT NOT NULL,
  drive_link    TEXT,
  summary       TEXT NOT NULL DEFAULT '',
  created_by    TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS concerns (
  id                   TEXT PRIMARY KEY,
  statement            TEXT NOT NULL,
  raised_by_id         TEXT NOT NULL,
  raised_by_name       TEXT NOT NULL,
  target_type          TEXT NOT NULL,
  target_id            TEXT,
  impact               TEXT NOT NULL DEFAULT '',
  evidence_link        TEXT,
  status               TEXT NOT NULL DEFAULT 'open',
  leadership_response  TEXT,
  responded_by         TEXT,
  responded_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS milestone_overrides (
  milestone_id  TEXT PRIMARY KEY,
  status        TEXT NOT NULL,
  rag           TEXT NOT NULL,
  note          TEXT NOT NULL DEFAULT '',
  updated_by    TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS okr_grades (
  kr_id       TEXT PRIMARY KEY,
  grade       NUMERIC(3,2) NOT NULL,
  note        TEXT NOT NULL DEFAULT '',
  updated_by  TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_overrides (
  document_id  TEXT PRIMARY KEY,
  description  TEXT NOT NULL DEFAULT '',
  extra_links  JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_by   TEXT NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_owner      ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone  ON tasks(milestone);
CREATE INDEX IF NOT EXISTS idx_concerns_status  ON concerns(status);
CREATE INDEX IF NOT EXISTS idx_concerns_target  ON concerns(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_change_log_task ON task_change_log(task_id);
