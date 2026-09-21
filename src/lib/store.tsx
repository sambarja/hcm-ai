"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

const STORAGE_KEY = "hcm-ai-pm.store.v1";

export type TaskStatus = "not_started" | "in_progress" | "for_review" | "done" | "blocked";

export interface TaskComment {
  id: string;
  author: string;
  authorId: string;
  at: string;
  text: string;
}

export interface TaskChange {
  id: string;
  actor: string;
  actorId: string;
  at: string;
  from: TaskStatus | null;
  to: TaskStatus | null;
  note: string | null;
}

export interface Task {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  status: TaskStatus;
  milestone: string;
  driveLink: string | null;
  jiraLink: string | null;
  criticalPath: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
  changeLog: TaskChange[];
}

export interface MeetingNote {
  id: string;
  meetingDate: string; // ISO date YYYY-MM-DD
  chair: string;
  driveLink: string | null;
  summary: string;
  attendees: string[];
  // Legacy fields kept optional so old localStorage payloads still hydrate.
  discussion?: string;
  decisions?: string;
  actions?: string;
  concerns?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Concern {
  id: string;
  statement: string;
  raisedById: string;
  raisedByName: string;
  targetType: "task" | "document" | "meeting" | "milestone" | "general";
  targetId: string | null;
  impact: string;
  evidenceLink: string | null;
  status: "open" | "acknowledged" | "accepted" | "disputed" | "deferred" | "closed";
  leadershipResponse: string | null;
  respondedBy: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export type Rag = "green" | "amber" | "red" | "gold" | "gray";
export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "at_risk"
  | "blocked"
  | "done"
  | "deferred";

export interface MilestoneOverride {
  status: MilestoneStatus;
  rag: Rag;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface OkrGrade {
  grade: number;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface DocumentExtraLink {
  id: string;
  label: string;
  url: string;
}

export interface DocumentOverride {
  description: string;
  extraLinks: DocumentExtraLink[];
  updatedBy: string;
  updatedAt: string;
}

interface StoreShape {
  tasks: Task[];
  meetings: MeetingNote[];
  concerns: Concern[];
  milestoneOverrides: Record<string, MilestoneOverride>;
  okrGrades: Record<string, OkrGrade>;
  documentOverrides: Record<string, DocumentOverride>;
}

const EMPTY: StoreShape = {
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
  addTask: (t: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments" | "changeLog">) => Task;
  updateTask: (id: string, patch: Partial<Task>, actor: { id: string; name: string }) => void;
  changeStatus: (id: string, to: TaskStatus, actor: { id: string; name: string }, note?: string) => void;
  addComment: (taskId: string, comment: Omit<TaskComment, "id" | "at">) => void;
  deleteTask: (id: string) => void;
  addMeeting: (m: Omit<MeetingNote, "id" | "createdAt" | "updatedAt">) => MeetingNote;
  updateMeeting: (id: string, patch: Partial<MeetingNote>) => void;
  deleteMeeting: (id: string) => void;
  addConcern: (c: Omit<Concern, "id" | "createdAt" | "status" | "leadershipResponse" | "respondedBy" | "respondedAt">) => Concern;
  respondToConcern: (id: string, response: string, responder: { id: string; name: string }, status: Concern["status"]) => void;
  setMilestoneOverride: (milestoneId: string, patch: Omit<MilestoneOverride, "updatedAt">) => void;
  clearMilestoneOverride: (milestoneId: string) => void;
  setOkrGrade: (krId: string, patch: Omit<OkrGrade, "updatedAt">) => void;
  clearOkrGrade: (krId: string) => void;
  documentOverrides: Record<string, DocumentOverride>;
  setDocumentOverride: (docId: string, patch: { description: string; extraLinks: DocumentExtraLink[]; updatedBy: string }) => void;
  clearDocumentOverride: (docId: string) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function nowIso() {
  return new Date().toISOString();
}
function shortId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreShape>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<StoreShape>;
        setState({
          tasks: parsed.tasks ?? [],
          meetings: parsed.meetings ?? [],
          concerns: parsed.concerns ?? [],
          milestoneOverrides: parsed.milestoneOverrides ?? {},
          okrGrades: parsed.okrGrades ?? {},
          documentOverrides: parsed.documentOverrides ?? {},
        });
      }
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  function addTask(t: Omit<Task, "id" | "createdAt" | "updatedAt" | "comments" | "changeLog">) {
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
    return task;
  }

  function updateTask(id: string, patch: Partial<Task>, actor: { id: string; name: string }) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t;
        const changed: TaskChange[] = [];
        (Object.keys(patch) as (keyof Task)[]).forEach((k) => {
          if (k === "status") return; // status has its own transition method
          if (t[k] !== patch[k] && k !== "comments" && k !== "changeLog" && k !== "updatedAt") {
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
        return {
          ...t,
          ...patch,
          updatedAt: nowIso(),
          changeLog: [...t.changeLog, ...changed],
        };
      }),
    }));
  }

  function changeStatus(id: string, to: TaskStatus, actor: { id: string; name: string }, note?: string) {
    setState((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t;
        return {
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
        };
      }),
    }));
  }

  function addComment(taskId: string, comment: Omit<TaskComment, "id" | "at">) {
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

  function deleteTask(id: string) {
    setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
  }

  function addMeeting(m: Omit<MeetingNote, "id" | "createdAt" | "updatedAt">) {
    const note: MeetingNote = { ...m, id: shortId("MN"), createdAt: nowIso(), updatedAt: nowIso() };
    setState((s) => ({ ...s, meetings: [note, ...s.meetings] }));
    return note;
  }

  function updateMeeting(id: string, patch: Partial<MeetingNote>) {
    setState((s) => ({
      ...s,
      meetings: s.meetings.map((m) => (m.id === id ? { ...m, ...patch, updatedAt: nowIso() } : m)),
    }));
  }

  function deleteMeeting(id: string) {
    setState((s) => ({ ...s, meetings: s.meetings.filter((m) => m.id !== id) }));
  }

  function addConcern(
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
    return concern;
  }

  function respondToConcern(
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

  function setMilestoneOverride(milestoneId: string, patch: Omit<MilestoneOverride, "updatedAt">) {
    setState((s) => ({
      ...s,
      milestoneOverrides: {
        ...s.milestoneOverrides,
        [milestoneId]: { ...patch, updatedAt: nowIso() },
      },
    }));
  }

  function clearMilestoneOverride(milestoneId: string) {
    setState((s) => {
      const next = { ...s.milestoneOverrides };
      delete next[milestoneId];
      return { ...s, milestoneOverrides: next };
    });
  }

  function setOkrGrade(krId: string, patch: Omit<OkrGrade, "updatedAt">) {
    setState((s) => ({
      ...s,
      okrGrades: {
        ...s.okrGrades,
        [krId]: { ...patch, updatedAt: nowIso() },
      },
    }));
  }

  function clearOkrGrade(krId: string) {
    setState((s) => {
      const next = { ...s.okrGrades };
      delete next[krId];
      return { ...s, okrGrades: next };
    });
  }

  function setDocumentOverride(
    docId: string,
    patch: { description: string; extraLinks: DocumentExtraLink[]; updatedBy: string }
  ) {
    setState((s) => ({
      ...s,
      documentOverrides: {
        ...s.documentOverrides,
        [docId]: { ...patch, updatedAt: nowIso() },
      },
    }));
  }

  function clearDocumentOverride(docId: string) {
    setState((s) => {
      const next = { ...s.documentOverrides };
      delete next[docId];
      return { ...s, documentOverrides: next };
    });
  }

  function resetAll() {
    setState(EMPTY);
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
