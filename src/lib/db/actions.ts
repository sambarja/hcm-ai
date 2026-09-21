"use server";

import { sql, ensureSchema, isDbConfigured } from "./client";
import type {
  Task,
  TaskStatus,
  TaskComment,
  TaskChange,
  MeetingNote,
  Concern,
  MilestoneOverride,
  MilestoneStatus,
  Rag,
  OkrGrade,
  DocumentOverride,
  DocumentExtraLink,
  Snapshot,
} from "./types";

function nowIso() {
  return new Date().toISOString();
}
function shortId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function withDb<T>(fn: () => Promise<T>): Promise<T> {
  if (!isDbConfigured()) throw new Error("Database not configured (POSTGRES_URL missing)");
  await ensureSchema();
  return fn();
}

// -------------------- Snapshot --------------------

export async function fetchSnapshot(): Promise<Snapshot> {
  return withDb(async () => {
    const [tasksRes, commentsRes, changeLogRes, meetingsRes, concernsRes, msOvRes, okrRes, docOvRes] =
      await Promise.all([
        sql`SELECT * FROM tasks ORDER BY created_at DESC`,
        sql`SELECT * FROM task_comments ORDER BY at ASC`,
        sql`SELECT * FROM task_change_log ORDER BY at ASC`,
        sql`SELECT * FROM meetings ORDER BY meeting_date DESC`,
        sql`SELECT * FROM concerns ORDER BY created_at DESC`,
        sql`SELECT * FROM milestone_overrides`,
        sql`SELECT * FROM okr_grades`,
        sql`SELECT * FROM document_overrides`,
      ]);

    const commentsByTask = new Map<string, TaskComment[]>();
    for (const r of commentsRes.rows) {
      const c: TaskComment = {
        id: r.id as string,
        author: r.author as string,
        authorId: r.author_id as string,
        text: r.text as string,
        at: (r.at as Date).toISOString(),
      };
      const arr = commentsByTask.get(r.task_id as string) ?? [];
      arr.push(c);
      commentsByTask.set(r.task_id as string, arr);
    }

    const changesByTask = new Map<string, TaskChange[]>();
    for (const r of changeLogRes.rows) {
      const c: TaskChange = {
        id: r.id as string,
        actor: r.actor as string,
        actorId: r.actor_id as string,
        from: (r.from_status as TaskStatus) ?? null,
        to: (r.to_status as TaskStatus) ?? null,
        note: (r.note as string) ?? null,
        at: (r.at as Date).toISOString(),
      };
      const arr = changesByTask.get(r.task_id as string) ?? [];
      arr.push(c);
      changesByTask.set(r.task_id as string, arr);
    }

    const tasks: Task[] = tasksRes.rows.map((r) => ({
      id: r.id as string,
      title: r.title as string,
      ownerId: r.owner_id as string,
      ownerName: r.owner_name as string,
      status: r.status as TaskStatus,
      milestone: r.milestone as string,
      driveLink: (r.drive_link as string) ?? null,
      jiraLink: (r.jira_link as string) ?? null,
      criticalPath: Boolean(r.critical_path),
      createdBy: r.created_by as string,
      createdAt: (r.created_at as Date).toISOString(),
      updatedAt: (r.updated_at as Date).toISOString(),
      comments: commentsByTask.get(r.id as string) ?? [],
      changeLog: changesByTask.get(r.id as string) ?? [],
    }));

    const meetings: MeetingNote[] = meetingsRes.rows.map((r) => ({
      id: r.id as string,
      meetingDate: (r.meeting_date as Date).toISOString().slice(0, 10),
      chair: r.chair as string,
      driveLink: (r.drive_link as string) ?? null,
      summary: (r.summary as string) ?? "",
      attendees: [],
      createdBy: r.created_by as string,
      createdAt: (r.created_at as Date).toISOString(),
      updatedAt: (r.updated_at as Date).toISOString(),
    }));

    const concerns: Concern[] = concernsRes.rows.map((r) => ({
      id: r.id as string,
      statement: r.statement as string,
      raisedById: r.raised_by_id as string,
      raisedByName: r.raised_by_name as string,
      targetType: r.target_type as Concern["targetType"],
      targetId: (r.target_id as string) ?? null,
      impact: (r.impact as string) ?? "",
      evidenceLink: (r.evidence_link as string) ?? null,
      status: r.status as Concern["status"],
      leadershipResponse: (r.leadership_response as string) ?? null,
      respondedBy: (r.responded_by as string) ?? null,
      respondedAt: r.responded_at ? (r.responded_at as Date).toISOString() : null,
      createdAt: (r.created_at as Date).toISOString(),
    }));

    const milestoneOverrides: Record<string, MilestoneOverride> = {};
    for (const r of msOvRes.rows) {
      milestoneOverrides[r.milestone_id as string] = {
        status: r.status as MilestoneStatus,
        rag: r.rag as Rag,
        note: (r.note as string) ?? "",
        updatedBy: r.updated_by as string,
        updatedAt: (r.updated_at as Date).toISOString(),
      };
    }

    const okrGrades: Record<string, OkrGrade> = {};
    for (const r of okrRes.rows) {
      okrGrades[r.kr_id as string] = {
        grade: Number(r.grade),
        note: (r.note as string) ?? "",
        updatedBy: r.updated_by as string,
        updatedAt: (r.updated_at as Date).toISOString(),
      };
    }

    const documentOverrides: Record<string, DocumentOverride> = {};
    for (const r of docOvRes.rows) {
      documentOverrides[r.document_id as string] = {
        description: (r.description as string) ?? "",
        extraLinks: (r.extra_links as DocumentExtraLink[]) ?? [],
        managedBy: (r.managed_by as string) ?? null,
        updatedBy: r.updated_by as string,
        updatedAt: (r.updated_at as Date).toISOString(),
      };
    }

    return { tasks, meetings, concerns, milestoneOverrides, okrGrades, documentOverrides };
  });
}

// -------------------- Task actions --------------------

export async function createTask(input: {
  title: string;
  ownerId: string;
  ownerName: string;
  status: TaskStatus;
  milestone: string;
  driveLink: string | null;
  jiraLink: string | null;
  criticalPath: boolean;
  createdBy: string;
}): Promise<void> {
  await withDb(async () => {
    const id = shortId("T");
    await sql`
      INSERT INTO tasks (id, title, owner_id, owner_name, status, milestone,
        drive_link, jira_link, critical_path, created_by)
      VALUES (${id}, ${input.title}, ${input.ownerId}, ${input.ownerName},
        ${input.status}, ${input.milestone}, ${input.driveLink}, ${input.jiraLink},
        ${input.criticalPath}, ${input.createdBy})
    `;
    await sql`
      INSERT INTO task_change_log (id, task_id, actor, actor_id, from_status, to_status, note)
      VALUES (${shortId("CL")}, ${id}, ${input.createdBy}, ${input.ownerId},
        NULL, ${input.status}, 'Task created')
    `;
  });
}

export async function updateTaskFields(
  id: string,
  patch: Partial<Pick<Task, "title" | "ownerId" | "ownerName" | "milestone" | "driveLink" | "jiraLink" | "criticalPath">>,
  actor: { id: string; name: string }
): Promise<void> {
  await withDb(async () => {
    const now = nowIso();
    const existing = await sql`SELECT * FROM tasks WHERE id = ${id}`;
    if (existing.rows.length === 0) return;
    const row = existing.rows[0];
    const next = {
      title: patch.title ?? (row.title as string),
      owner_id: patch.ownerId ?? (row.owner_id as string),
      owner_name: patch.ownerName ?? (row.owner_name as string),
      milestone: patch.milestone ?? (row.milestone as string),
      drive_link: patch.driveLink !== undefined ? patch.driveLink : ((row.drive_link as string) ?? null),
      jira_link: patch.jiraLink !== undefined ? patch.jiraLink : ((row.jira_link as string) ?? null),
      critical_path: patch.criticalPath ?? Boolean(row.critical_path),
    };
    await sql`
      UPDATE tasks SET
        title = ${next.title},
        owner_id = ${next.owner_id},
        owner_name = ${next.owner_name},
        milestone = ${next.milestone},
        drive_link = ${next.drive_link},
        jira_link = ${next.jira_link},
        critical_path = ${next.critical_path},
        updated_at = ${now}
      WHERE id = ${id}
    `;
    const changed: string[] = [];
    for (const [key, oldVal, newVal] of [
      ["title", row.title, next.title],
      ["owner", row.owner_name, next.owner_name],
      ["milestone", row.milestone, next.milestone],
      ["drive_link", row.drive_link, next.drive_link],
      ["jira_link", row.jira_link, next.jira_link],
      ["critical_path", row.critical_path, next.critical_path],
    ] as const) {
      if (oldVal !== newVal) changed.push(`${key}: ${JSON.stringify(oldVal)} → ${JSON.stringify(newVal)}`);
    }
    if (changed.length) {
      await sql`
        INSERT INTO task_change_log (id, task_id, actor, actor_id, from_status, to_status, note)
        VALUES (${shortId("CL")}, ${id}, ${actor.name}, ${actor.id}, NULL, NULL, ${changed.join("; ")})
      `;
    }
  });
}

export async function changeTaskStatus(
  id: string,
  to: TaskStatus,
  actor: { id: string; name: string },
  note?: string
): Promise<void> {
  await withDb(async () => {
    const existing = await sql`SELECT status FROM tasks WHERE id = ${id}`;
    if (existing.rows.length === 0) return;
    const from = existing.rows[0].status as TaskStatus;
    const now = nowIso();
    await sql`UPDATE tasks SET status = ${to}, updated_at = ${now} WHERE id = ${id}`;
    await sql`
      INSERT INTO task_change_log (id, task_id, actor, actor_id, from_status, to_status, note)
      VALUES (${shortId("CL")}, ${id}, ${actor.name}, ${actor.id}, ${from}, ${to}, ${note ?? null})
    `;
  });
}

export async function addTaskComment(
  taskId: string,
  comment: { author: string; authorId: string; text: string }
): Promise<void> {
  await withDb(async () => {
    await sql`
      INSERT INTO task_comments (id, task_id, author, author_id, text)
      VALUES (${shortId("CM")}, ${taskId}, ${comment.author}, ${comment.authorId}, ${comment.text})
    `;
    await sql`UPDATE tasks SET updated_at = now() WHERE id = ${taskId}`;
  });
}

export async function deleteTaskById(id: string): Promise<void> {
  await withDb(async () => {
    await sql`DELETE FROM tasks WHERE id = ${id}`;
  });
}

// -------------------- Meeting actions --------------------

export async function upsertMeeting(input: {
  meetingDate: string;
  chair: string;
  driveLink: string | null;
  summary: string;
  createdBy: string;
}): Promise<void> {
  await withDb(async () => {
    await sql`
      INSERT INTO meetings (id, meeting_date, chair, drive_link, summary, created_by)
      VALUES (${shortId("MN")}, ${input.meetingDate}, ${input.chair},
        ${input.driveLink}, ${input.summary}, ${input.createdBy})
      ON CONFLICT (meeting_date) DO UPDATE
      SET chair = EXCLUDED.chair,
          drive_link = EXCLUDED.drive_link,
          summary = EXCLUDED.summary,
          updated_at = now()
    `;
  });
}

export async function deleteMeetingById(id: string): Promise<void> {
  await withDb(async () => {
    await sql`DELETE FROM meetings WHERE id = ${id}`;
  });
}

// -------------------- Concern actions --------------------

export async function createConcern(input: {
  statement: string;
  raisedById: string;
  raisedByName: string;
  targetType: Concern["targetType"];
  targetId: string | null;
  impact: string;
  evidenceLink: string | null;
}): Promise<void> {
  await withDb(async () => {
    await sql`
      INSERT INTO concerns (id, statement, raised_by_id, raised_by_name,
        target_type, target_id, impact, evidence_link)
      VALUES (${shortId("CN")}, ${input.statement}, ${input.raisedById}, ${input.raisedByName},
        ${input.targetType}, ${input.targetId}, ${input.impact}, ${input.evidenceLink})
    `;
  });
}

export async function respondToConcernById(
  id: string,
  response: string,
  responder: { id: string; name: string },
  status: Concern["status"]
): Promise<void> {
  await withDb(async () => {
    await sql`
      UPDATE concerns SET
        leadership_response = ${response},
        responded_by = ${responder.name},
        responded_at = ${nowIso()},
        status = ${status}
      WHERE id = ${id}
    `;
  });
}

// -------------------- Overrides --------------------

export async function upsertMilestoneOverride(
  milestoneId: string,
  patch: { status: MilestoneStatus; rag: Rag; note: string; updatedBy: string }
): Promise<void> {
  await withDb(async () => {
    await sql`
      INSERT INTO milestone_overrides (milestone_id, status, rag, note, updated_by)
      VALUES (${milestoneId}, ${patch.status}, ${patch.rag}, ${patch.note}, ${patch.updatedBy})
      ON CONFLICT (milestone_id) DO UPDATE
      SET status = EXCLUDED.status,
          rag = EXCLUDED.rag,
          note = EXCLUDED.note,
          updated_by = EXCLUDED.updated_by,
          updated_at = now()
    `;
  });
}

export async function deleteMilestoneOverride(milestoneId: string): Promise<void> {
  await withDb(async () => {
    await sql`DELETE FROM milestone_overrides WHERE milestone_id = ${milestoneId}`;
  });
}

export async function upsertOkrGrade(
  krId: string,
  patch: { grade: number; note: string; updatedBy: string }
): Promise<void> {
  await withDb(async () => {
    await sql`
      INSERT INTO okr_grades (kr_id, grade, note, updated_by)
      VALUES (${krId}, ${patch.grade}, ${patch.note}, ${patch.updatedBy})
      ON CONFLICT (kr_id) DO UPDATE
      SET grade = EXCLUDED.grade,
          note = EXCLUDED.note,
          updated_by = EXCLUDED.updated_by,
          updated_at = now()
    `;
  });
}

export async function deleteOkrGrade(krId: string): Promise<void> {
  await withDb(async () => {
    await sql`DELETE FROM okr_grades WHERE kr_id = ${krId}`;
  });
}

export async function upsertDocumentOverride(
  documentId: string,
  patch: {
    description: string;
    extraLinks: DocumentExtraLink[];
    managedBy: string | null;
    updatedBy: string;
  }
): Promise<void> {
  await withDb(async () => {
    const linksJson = JSON.stringify(patch.extraLinks);
    await sql`
      INSERT INTO document_overrides (document_id, description, extra_links, managed_by, updated_by)
      VALUES (${documentId}, ${patch.description}, ${linksJson}::jsonb, ${patch.managedBy}, ${patch.updatedBy})
      ON CONFLICT (document_id) DO UPDATE
      SET description = EXCLUDED.description,
          extra_links = EXCLUDED.extra_links,
          managed_by = EXCLUDED.managed_by,
          updated_by = EXCLUDED.updated_by,
          updated_at = now()
    `;
  });
}

export async function deleteDocumentOverride(documentId: string): Promise<void> {
  await withDb(async () => {
    await sql`DELETE FROM document_overrides WHERE document_id = ${documentId}`;
  });
}

// -------------------- Migration from localStorage --------------------

export async function migrateSnapshotIntoDb(snap: Snapshot, actor: { id: string; name: string }): Promise<{ inserted: number; skipped: number }> {
  return withDb(async () => {
    let inserted = 0;
    let skipped = 0;

    for (const t of snap.tasks) {
      const existing = await sql`SELECT id FROM tasks WHERE id = ${t.id}`;
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }
      await sql`
        INSERT INTO tasks (id, title, owner_id, owner_name, status, milestone,
          drive_link, jira_link, critical_path, created_by, created_at, updated_at)
        VALUES (${t.id}, ${t.title}, ${t.ownerId}, ${t.ownerName}, ${t.status},
          ${t.milestone}, ${t.driveLink}, ${t.jiraLink}, ${t.criticalPath},
          ${t.createdBy}, ${t.createdAt}, ${t.updatedAt})
      `;
      for (const c of t.comments) {
        await sql`
          INSERT INTO task_comments (id, task_id, author, author_id, text, at)
          VALUES (${c.id}, ${t.id}, ${c.author}, ${c.authorId}, ${c.text}, ${c.at})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      for (const c of t.changeLog) {
        await sql`
          INSERT INTO task_change_log (id, task_id, actor, actor_id, from_status, to_status, note, at)
          VALUES (${c.id}, ${t.id}, ${c.actor}, ${c.actorId}, ${c.from}, ${c.to}, ${c.note}, ${c.at})
          ON CONFLICT (id) DO NOTHING
        `;
      }
      inserted++;
    }

    for (const m of snap.meetings) {
      const existing = await sql`SELECT id FROM meetings WHERE meeting_date = ${m.meetingDate}`;
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }
      await sql`
        INSERT INTO meetings (id, meeting_date, chair, drive_link, summary, created_by, created_at, updated_at)
        VALUES (${m.id}, ${m.meetingDate}, ${m.chair}, ${m.driveLink}, ${m.summary},
          ${m.createdBy}, ${m.createdAt}, ${m.updatedAt})
      `;
      inserted++;
    }

    for (const c of snap.concerns) {
      const existing = await sql`SELECT id FROM concerns WHERE id = ${c.id}`;
      if (existing.rows.length > 0) {
        skipped++;
        continue;
      }
      await sql`
        INSERT INTO concerns (id, statement, raised_by_id, raised_by_name,
          target_type, target_id, impact, evidence_link,
          status, leadership_response, responded_by, responded_at, created_at)
        VALUES (${c.id}, ${c.statement}, ${c.raisedById}, ${c.raisedByName},
          ${c.targetType}, ${c.targetId}, ${c.impact}, ${c.evidenceLink},
          ${c.status}, ${c.leadershipResponse}, ${c.respondedBy}, ${c.respondedAt}, ${c.createdAt})
      `;
      inserted++;
    }

    for (const [msId, ov] of Object.entries(snap.milestoneOverrides)) {
      await upsertMilestoneOverride(msId, {
        status: ov.status,
        rag: ov.rag,
        note: ov.note,
        updatedBy: ov.updatedBy,
      });
      inserted++;
    }
    for (const [krId, ov] of Object.entries(snap.okrGrades)) {
      await upsertOkrGrade(krId, {
        grade: ov.grade,
        note: ov.note,
        updatedBy: ov.updatedBy,
      });
      inserted++;
    }
    for (const [docId, ov] of Object.entries(snap.documentOverrides)) {
      await upsertDocumentOverride(docId, {
        description: ov.description,
        extraLinks: ov.extraLinks,
        managedBy: ov.managedBy ?? null,
        updatedBy: ov.updatedBy,
      });
      inserted++;
    }

    return { inserted, skipped };
  });
}
