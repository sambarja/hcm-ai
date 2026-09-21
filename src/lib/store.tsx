"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
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
} from "./db/types";
import {
  createTask,
  updateTaskFields,
  changeTaskStatus,
  addTaskComment,
  deleteTaskById,
  upsertMeeting,
  deleteMeetingById,
  createConcern,
  respondToConcernById,
  upsertMilestoneOverride,
  deleteMilestoneOverride,
  upsertOkrGrade,
  deleteOkrGrade,
  upsertDocumentOverride,
  deleteDocumentOverride,
  migrateSnapshotIntoDb,
} from "./db/actions";

// Re-export types for existing callers.
export type {
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
} from "./db/types";

const STORAGE_KEY = "hcm-ai-pm.store.v1";

const EMPTY: Snapshot = {
  tasks: [],
  meetings: [],
  concerns: [],
  milestoneOverrides: {},
  okrGrades: {},
  documentOverrides: {},
};

interface StoreContextValue {
  tasks: Task[];
  meetings: MeetingNote[];
  concerns: Concern[];
  milestoneOverrides: Record<string, MilestoneOverride>;
  okrGrades: Record<string, OkrGrade>;
  documentOverrides: Record<string, DocumentOverride>;
  addTask: (t: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments" | "changeLog">) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>, actor: { id: string; name: string }) => Promise<void>;
  changeStatus: (id: string, to: TaskStatus, actor: { id: string; name: string }, note?: string) => Promise<void>;
  addComment: (taskId: string, comment: Omit<TaskComment, "id" | "at">) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addMeeting: (m: Omit<MeetingNote, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateMeeting: (id: string, patch: Partial<MeetingNote>) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  addConcern: (
    c: Omit<Concern, "id" | "createdAt" | "status" | "leadershipResponse" | "respondedBy" | "respondedAt">
  ) => Promise<void>;
  respondToConcern: (
    id: string,
    response: string,
    responder: { id: string; name: string },
    status: Concern["status"]
  ) => Promise<void>;
  setMilestoneOverride: (milestoneId: string, patch: Omit<MilestoneOverride, "updatedAt">) => Promise<void>;
  clearMilestoneOverride: (milestoneId: string) => Promise<void>;
  setOkrGrade: (krId: string, patch: Omit<OkrGrade, "updatedAt">) => Promise<void>;
  clearOkrGrade: (krId: string) => Promise<void>;
  setDocumentOverride: (docId: string, patch: { description: string; extraLinks: DocumentExtraLink[]; updatedBy: string }) => Promise<void>;
  clearDocumentOverride: (docId: string) => Promise<void>;
  resetAll: () => void;
  isDbMode: boolean;
  hydrated: boolean;
  refresh: () => Promise<void>;
  migrateLocalToDb: (actor: { id: string; name: string }) => Promise<{ inserted: number; skipped: number }>;
  hasLocalDataToMigrate: boolean;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}
function shortId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function readLocalStorage(): Snapshot | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    return {
      tasks: parsed.tasks ?? [],
      meetings: parsed.meetings ?? [],
      concerns: parsed.concerns ?? [],
      milestoneOverrides: parsed.milestoneOverrides ?? {},
      okrGrades: parsed.okrGrades ?? {},
      documentOverrides: parsed.documentOverrides ?? {},
    };
  } catch {
    return null;
  }
}

function writeLocalStorage(snap: Snapshot) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snap));
  } catch {}
}

function isEmptySnapshot(s: Snapshot): boolean {
  return (
    s.tasks.length === 0 &&
    s.meetings.length === 0 &&
    s.concerns.length === 0 &&
    Object.keys(s.milestoneOverrides).length === 0 &&
    Object.keys(s.okrGrades).length === 0 &&
    Object.keys(s.documentOverrides).length === 0
  );
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Snapshot>(EMPTY);
  const [isDbMode, setIsDbMode] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [hasLocalDataToMigrate, setHasLocalDataToMigrate] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/store", { cache: "no-store" });
      const json = (await res.json()) as {
        dbConfigured: boolean;
        snapshot: Snapshot | null;
        error?: string;
      };
      if (json.dbConfigured && json.snapshot) {
        setState(json.snapshot);
        setIsDbMode(true);
        const local = readLocalStorage();
        setHasLocalDataToMigrate(!!local && !isEmptySnapshot(local));
      } else {
        const local = readLocalStorage();
        setState(local ?? EMPTY);
        setIsDbMode(false);
        setHasLocalDataToMigrate(false);
      }
    } catch {
      const local = readLocalStorage();
      setState(local ?? EMPTY);
      setIsDbMode(false);
      setHasLocalDataToMigrate(false);
    }
  }, []);

  useEffect(() => {
    refresh().then(() => setHydrated(true));
  }, [refresh]);

  useEffect(() => {
    if (!hydrated || isDbMode) return;
    writeLocalStorage(state);
  }, [state, hydrated, isDbMode]);

  // ---- Local-only mutators (used when isDbMode is false) ----

  function localAddTask(t: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments" | "changeLog">) {
    const task: Task = {
      ...t,
      id: shortId("T"),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      comments: [],
      changeLog: [
        {
          id: shortId("CL"),
          actor: t.createdBy,
          actorId: t.ownerId,
          at: nowIso(),
          from: null,
          to: t.status,
          note: "Task created",
        },
      ],
    };
    setState((s) => ({ ...s, tasks: [task, ...s.tasks] }));
  }

  function localUpdateTask(id: string, patch: Partial<Task>, actor: { id: string; name: string }) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t;
        const changed: TaskChange[] = [];
        (Object.keys(patch) as (keyof Task)[]).forEach((k) => {
          if (k === "status" || k === "comments" || k === "changeLog" || k === "updatedAt") return;
          if (t[k] !== patch[k]) {
            changed.push({
              id: shortId("CL"),
              actor: actor.name,
              actorId: actor.id,
              at: nowIso(),
              from: null,
              to: null,
              note: `Changed ${String(k)}: ${JSON.stringify(t[k])} → ${JSON.stringify(patch[k])}`,
            });
          }
        });
        return { ...t, ...patch, updatedAt: nowIso(), changeLog: [...t.changeLog, ...changed] };
      }),
    }));
  }

  function localChangeStatus(id: string, to: TaskStatus, actor: { id: string; name: string }, note?: string) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id !== id
          ? t
          : {
              ...t,
              status: to,
              updatedAt: nowIso(),
              changeLog: [
                ...t.changeLog,
                {
                  id: shortId("CL"),
                  actor: actor.name,
                  actorId: actor.id,
                  at: nowIso(),
                  from: t.status,
                  to,
                  note: note ?? null,
                },
              ],
            }
      ),
    }));
  }

  function localAddComment(taskId: string, comment: Omit<TaskComment, "id" | "at">) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              comments: [...t.comments, { ...comment, id: shortId("CM"), at: nowIso() }],
              updatedAt: nowIso(),
            }
          : t
      ),
    }));
  }

  function localDeleteTask(id: string) {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }

  function localAddMeeting(m: Omit<MeetingNote, "id" | "createdAt" | "updatedAt">) {
    const note: MeetingNote = { ...m, id: shortId("MN"), createdAt: nowIso(), updatedAt: nowIso() };
    setState((s) => ({ ...s, meetings: [note, ...s.meetings] }));
  }

  function localUpdateMeeting(id: string, patch: Partial<MeetingNote>) {
    setState((s) => ({
      ...s,
      meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: nowIso() } : m)),
    }));
  }

  function localDeleteMeeting(id: string) {
    setState((s) => ({ ...s, meetings: s.meetings.filter((m) => m.id !== id) }));
  }

  function localAddConcern(
    c: Omit<Concern, "id" | "createdAt" | "status" | "leadershipResponse" | "respondedBy" | "respondedAt">
  ) {
    const concern: Concern = {
      ...c,
      id: shortId("CN"),
      createdAt: nowIso(),
      status: "open",
      leadershipResponse: null,
      respondedBy: null,
      respondedAt: null,
    };
    setState((s) => ({ ...s, concerns: [concern, ...s.concerns] }));
  }

  function localRespond(
    id: string,
    response: string,
    responder: { id: string; name: string },
    status: Concern["status"]
  ) {
    setState((s) => ({
      ...s,
      concerns: s.concerns.map((c) =>
        c.id === id
          ? {
              ...c,
              leadershipResponse: response,
              respondedBy: responder.name,
              respondedAt: nowIso(),
              status,
            }
          : c
      ),
    }));
  }

  // ---- Public mutators — dual-route ----

  async function addTask(t: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments" | "changeLog">) {
    if (isDbMode) {
      await createTask({
        title: t.title,
        ownerId: t.ownerId,
        ownerName: t.ownerName,
        status: t.status,
        milestone: t.milestone,
        driveLink: t.driveLink,
        jiraLink: t.jiraLink,
        criticalPath: t.criticalPath,
        createdBy: t.createdBy,
      });
      await refresh();
    } else {
      localAddTask(t);
    }
  }

  async function updateTask(id: string, patch: Partial<Task>, actor: { id: string; name: string }) {
    if (isDbMode) {
      await updateTaskFields(id, {
        title: patch.title,
        ownerId: patch.ownerId,
        ownerName: patch.ownerName,
        milestone: patch.milestone,
        driveLink: patch.driveLink,
        jiraLink: patch.jiraLink,
        criticalPath: patch.criticalPath,
      }, actor);
      await refresh();
    } else {
      localUpdateTask(id, patch, actor);
    }
  }

  async function changeStatus(
    id: string,
    to: TaskStatus,
    actor: { id: string; name: string },
    note?: string
  ) {
    if (isDbMode) {
      await changeTaskStatus(id, to, actor, note);
      await refresh();
    } else {
      localChangeStatus(id, to, actor, note);
    }
  }

  async function addComment(taskId: string, comment: Omit<TaskComment, "id" | "at">) {
    if (isDbMode) {
      await addTaskComment(taskId, {
        author: comment.author,
        authorId: comment.authorId,
        text: comment.text,
      });
      await refresh();
    } else {
      localAddComment(taskId, comment);
    }
  }

  async function deleteTask(id: string) {
    if (isDbMode) {
      await deleteTaskById(id);
      await refresh();
    } else {
      localDeleteTask(id);
    }
  }

  async function addMeeting(m: Omit<MeetingNote, "id" | "createdAt" | "updatedAt">) {
    if (isDbMode) {
      await upsertMeeting({
        meetingDate: m.meetingDate,
        chair: m.chair,
        driveLink: m.driveLink,
        summary: m.summary,
        createdBy: m.createdBy,
      });
      await refresh();
    } else {
      localAddMeeting(m);
    }
  }

  async function updateMeeting(id: string, patch: Partial<MeetingNote>) {
    if (isDbMode) {
      const target = state.meetings.find((m) => m.id === id);
      if (!target) return;
      await upsertMeeting({
        meetingDate: patch.meetingDate ?? target.meetingDate,
        chair: patch.chair ?? target.chair,
        driveLink: patch.driveLink !== undefined ? patch.driveLink : target.driveLink,
        summary: patch.summary ?? target.summary,
        createdBy: target.createdBy,
      });
      await refresh();
    } else {
      localUpdateMeeting(id, patch);
    }
  }

  async function deleteMeeting(id: string) {
    if (isDbMode) {
      await deleteMeetingById(id);
      await refresh();
    } else {
      localDeleteMeeting(id);
    }
  }

  async function addConcern(
    c: Omit<Concern, "id" | "createdAt" | "status" | "leadershipResponse" | "respondedBy" | "respondedAt">
  ) {
    if (isDbMode) {
      await createConcern({
        statement: c.statement,
        raisedById: c.raisedById,
        raisedByName: c.raisedByName,
        targetType: c.targetType,
        targetId: c.targetId,
        impact: c.impact,
        evidenceLink: c.evidenceLink,
      });
      await refresh();
    } else {
      localAddConcern(c);
    }
  }

  async function respondToConcern(
    id: string,
    response: string,
    responder: { id: string; name: string },
    status: Concern["status"]
  ) {
    if (isDbMode) {
      await respondToConcernById(id, response, responder, status);
      await refresh();
    } else {
      localRespond(id, response, responder, status);
    }
  }

  async function setMilestoneOverride(
    milestoneId: string,
    patch: Omit<MilestoneOverride, "updatedAt">
  ) {
    if (isDbMode) {
      await upsertMilestoneOverride(milestoneId, {
        status: patch.status,
        rag: patch.rag,
        note: patch.note,
        updatedBy: patch.updatedBy,
      });
      await refresh();
    } else {
      setState((s) => ({
        ...s,
        milestoneOverrides: {
          ...s.milestoneOverrides,
          [milestoneId]: { ...patch, updatedAt: nowIso() },
        },
      }));
    }
  }

  async function clearMilestoneOverride(milestoneId: string) {
    if (isDbMode) {
      await deleteMilestoneOverride(milestoneId);
      await refresh();
    } else {
      setState((s) => {
        const next = { ...s.milestoneOverrides };
        delete next[milestoneId];
        return { ...s, milestoneOverrides: next };
      });
    }
  }

  async function setOkrGrade(krId: string, patch: Omit<OkrGrade, "updatedAt">) {
    if (isDbMode) {
      await upsertOkrGrade(krId, {
        grade: patch.grade,
        note: patch.note,
        updatedBy: patch.updatedBy,
      });
      await refresh();
    } else {
      setState((s) => ({
        ...s,
        okrGrades: {
          ...s.okrGrades,
          [krId]: { ...patch, updatedAt: nowIso() },
        },
      }));
    }
  }

  async function clearOkrGrade(krId: string) {
    if (isDbMode) {
      await deleteOkrGrade(krId);
      await refresh();
    } else {
      setState((s) => {
        const next = { ...s.okrGrades };
        delete next[krId];
        return { ...s, okrGrades: next };
      });
    }
  }

  async function setDocumentOverride(
    docId: string,
    patch: { description: string; extraLinks: DocumentExtraLink[]; updatedBy: string }
  ) {
    if (isDbMode) {
      await upsertDocumentOverride(docId, patch);
      await refresh();
    } else {
      setState((s) => ({
        ...s,
        documentOverrides: {
          ...s.documentOverrides,
          [docId]: { ...patch, updatedAt: nowIso() },
        },
      }));
    }
  }

  async function clearDocumentOverride(docId: string) {
    if (isDbMode) {
      await deleteDocumentOverride(docId);
      await refresh();
    } else {
      setState((s) => {
        const next = { ...s.documentOverrides };
        delete next[docId];
        return { ...s, documentOverrides: next };
      });
    }
  }

  function resetAll() {
    if (isDbMode) return; // safety: don't wipe DB from a client button
    setState(EMPTY);
  }

  async function migrateLocalToDb(actor: { id: string; name: string }) {
    if (!isDbMode) throw new Error("DB is not configured");
    const local = readLocalStorage();
    if (!local || isEmptySnapshot(local)) return { inserted: 0, skipped: 0 };
    const result = await migrateSnapshotIntoDb(local, actor);
    try {
      localStorage.setItem(STORAGE_KEY + ".migrated", JSON.stringify({ at: nowIso(), ...result }));
    } catch {}
    await refresh();
    setHasLocalDataToMigrate(false);
    return result;
  }

  return (
    <StoreContext.Provider
      value={{
        tasks: state.tasks,
        meetings: state.meetings,
        concerns: state.concerns,
        milestoneOverrides: state.milestoneOverrides,
        okrGrades: state.okrGrades,
        documentOverrides: state.documentOverrides,
        addTask,
        updateTask,
        changeStatus,
        addComment,
        deleteTask,
        addMeeting,
        updateMeeting,
        deleteMeeting,
        addConcern,
        respondToConcern,
        setMilestoneOverride,
        clearMilestoneOverride,
        setOkrGrade,
        clearOkrGrade,
        setDocumentOverride,
        clearDocumentOverride,
        resetAll,
        isDbMode,
        hydrated,
        refresh,
        migrateLocalToDb,
        hasLocalDataToMigrate,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  for_review: "For Review",
  done: "Done",
  blocked: "Blocked",
};

export const STATUS_COLOR: Record<TaskStatus, string> = {
  not_started: "bg-slate-100 text-slate-700",
  in_progress: "bg-blue-100 text-blue-800",
  for_review: "bg-amber-100 text-amber-800",
  done: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
};
