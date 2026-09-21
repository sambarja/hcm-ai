"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useStore, STATUS_LABEL, STATUS_COLOR, type Task, type TaskStatus } from "@/lib/store";
import teamData from "@/data/team.json";
import milestones from "@/data/milestones.json";
import type { TeamMember } from "@/types";

const MILESTONE_IDS = ["M0", "M1", "M2", "M3", "M4", "M5", "MR"] as const;

export default function TasksPage() {
  const { user, isAdmin } = useAuth();
  const { tasks, addTask, updateTask, changeStatus, deleteTask, addComment } = useStore();
  const roster = teamData as TeamMember[];
  const [showNew, setShowNew] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "mine" | TaskStatus>("all");

  const visible = useMemo(() => {
    if (filter === "all") return tasks;
    if (filter === "mine") return tasks.filter((t) => t.ownerId === user?.id);
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter, user?.id]);

  const byStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      not_started: [],
      in_progress: [],
      for_review: [],
      done: [],
      blocked: [],
    };
    visible.forEach((t) => groups[t.status].push(t));
    return groups;
  }, [visible]);

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle="Add, edit, and move work through the pipeline. Drive-link is required to move a task to For Review; only Admins can mark Done."
        right={
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-[12px] border border-slate-300 rounded px-2 py-1"
            >
              <option value="all">All ({tasks.length})</option>
              <option value="mine">Mine</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="for_review">For Review</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
            {isAdmin && (
              <button
                onClick={() => setShowNew((s) => !s)}
                className="text-[13px] bg-ink text-white px-3 py-1.5 rounded hover:bg-slate-800"
              >
                {showNew ? "Cancel" : "+ New task"}
              </button>
            )}
          </div>
        }
      />

      {showNew && isAdmin && user && (
        <NewTaskForm
          currentUser={user}
          roster={roster}
          onCancel={() => setShowNew(false)}
          onSubmit={(t) => {
            addTask({
              ...t,
              createdBy: user.name,
            });
            setShowNew(false);
          }}
        />
      )}

      {visible.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded p-12 text-center text-ink-2 text-[13px]">
          No tasks yet.{" "}
          {isAdmin ? "Click \"+ New task\" to add the first one." : "Ask an Admin to add tasks."}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
          {(["not_started", "in_progress", "for_review", "done", "blocked"] as TaskStatus[]).map(
            (col) => (
              <div key={col} className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-ink-2 mb-2 flex items-center justify-between">
                  <span>{STATUS_LABEL[col]}</span>
                  <span className="mono text-ink-2">{byStatus[col].length}</span>
                </div>
                <div className="space-y-2">
                  {byStatus[col].map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      expanded={expandedId === t.id}
                      onToggle={() => setExpandedId((id) => (id === t.id ? null : t.id))}
                      currentUser={user}
                      isAdmin={isAdmin}
                      roster={roster}
                      onUpdate={(patch) =>
                        user && updateTask(t.id, patch, { id: user.id, name: user.name })
                      }
                      onStatus={(to, note) =>
                        user && changeStatus(t.id, to, { id: user.id, name: user.name }, note)
                      }
                      onComment={(text) =>
                        user &&
                        addComment(t.id, {
                          author: user.name,
                          authorId: user.id,
                          text,
                        })
                      }
                      onDelete={() => {
                        if (confirm("Delete this task?")) deleteTask(t.id);
                      }}
                    />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      <div className="mt-8 text-[11px] text-ink-2">
        Storage: browser localStorage (per-device). Real multi-user shared state comes in Phase 2b —
        Vercel Postgres + server actions.
      </div>
    </div>
  );
}

function NewTaskForm({
  currentUser,
  roster,
  onSubmit,
  onCancel,
}: {
  currentUser: TeamMember;
  roster: TeamMember[];
  onSubmit: (t: {
    title: string;
    ownerId: string;
    ownerName: string;
    status: TaskStatus;
    milestone: string;
    driveLink: string | null;
    jiraLink: string | null;
    criticalPath: boolean;
  }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [ownerId, setOwnerId] = useState(currentUser.id);
  const [milestone, setMilestone] = useState<string>("M0");
  const [driveLink, setDriveLink] = useState("");
  const [jiraLink, setJiraLink] = useState("");
  const [criticalPath, setCriticalPath] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const owner = roster.find((m) => m.id === ownerId)!;
    onSubmit({
      title: title.trim(),
      ownerId: owner.id,
      ownerName: owner.name,
      status: "not_started",
      milestone,
      driveLink: driveLink.trim() || null,
      jiraLink: jiraLink.trim() || null,
      criticalPath,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="card mb-6 bg-slate-50 border border-slate-300 space-y-3"
    >
      <div>
        <Label>Task title</Label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Freeze rules pack v1.0 for M1"
          className="w-full border border-slate-300 rounded px-3 py-2 text-[14px]"
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Owner</Label>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-[14px]"
          >
            {roster.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.role}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Milestone</Label>
          <select
            value={milestone}
            onChange={(e) => setMilestone(e.target.value)}
            className="w-full border border-slate-300 rounded px-3 py-2 text-[14px]"
          >
            {MILESTONE_IDS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <Label>Drive link (Google Drive URL for evidence / working doc)</Label>
        <input
          value={driveLink}
          onChange={(e) => setDriveLink(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="w-full border border-slate-300 rounded px-3 py-2 text-[13px] mono"
        />
      </div>
      <div>
        <Label>Jira link (optional)</Label>
        <input
          value={jiraLink}
          onChange={(e) => setJiraLink(e.target.value)}
          placeholder="https://supervaise.atlassian.net/browse/HRIS-..."
          className="w-full border border-slate-300 rounded px-3 py-2 text-[13px] mono"
        />
      </div>
      <div>
        <label className="text-[12px] text-ink flex items-center gap-2">
          <input
            type="checkbox"
            checked={criticalPath}
            onChange={(e) => setCriticalPath(e.target.checked)}
          />
          On critical path
        </label>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={!title.trim()}
          className="bg-ink text-white text-[13px] px-4 py-1.5 rounded disabled:opacity-40 hover:bg-slate-800"
        >
          Create task
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] text-ink-2 px-3 py-1.5 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function TaskCard({
  task,
  expanded,
  onToggle,
  currentUser,
  isAdmin,
  roster,
  onUpdate,
  onStatus,
  onComment,
  onDelete,
}: {
  task: Task;
  expanded: boolean;
  onToggle: () => void;
  currentUser: TeamMember | null;
  isAdmin: boolean;
  roster: TeamMember[];
  onUpdate: (patch: Partial<Task>) => void;
  onStatus: (to: TaskStatus, note?: string) => void;
  onComment: (text: string) => void;
  onDelete: () => void;
}) {
  const isOwner = currentUser?.id === task.ownerId;
  const canEdit = isOwner || isAdmin;
  const [editMode, setEditMode] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [draft, setDraft] = useState<Partial<Task>>({});

  function commitEdit() {
    if (Object.keys(draft).length) onUpdate(draft);
    setDraft({});
    setEditMode(false);
  }

  function nextStatuses(): TaskStatus[] {
    if (!canEdit) return [];
    switch (task.status) {
      case "not_started":
        return ["in_progress", "blocked"];
      case "in_progress":
        return ["for_review", "blocked"];
      case "for_review":
        return isAdmin ? ["done", "in_progress"] : ["in_progress"];
      case "done":
        return isAdmin ? ["in_progress"] : [];
      case "blocked":
        return ["in_progress"];
    }
  }

  const gateForReview = task.status === "in_progress" && !task.driveLink;

  return (
    <div className="card !p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onToggle} className="text-left flex-1 min-w-0">
          <div className="text-[13px] text-ink font-medium leading-tight">{task.title}</div>
          <div className="text-[10px] text-ink-2 mt-1 flex items-center gap-1.5">
            <span>{task.ownerName}</span>
            <span>·</span>
            <span className="mono">{task.milestone}</span>
            {task.criticalPath && (
              <>
                <span>·</span>
                <span className="text-amber-700 font-semibold">CP</span>
              </>
            )}
          </div>
        </button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={"text-[10px] mono px-1.5 py-0.5 rounded " + STATUS_COLOR[task.status]}>
          {STATUS_LABEL[task.status]}
        </span>
        {task.driveLink && (
          <a
            href={task.driveLink}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-blue-700 hover:underline"
          >
            Drive ↗
          </a>
        )}
        {task.jiraLink && (
          <a
            href={task.jiraLink}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-blue-700 hover:underline"
          >
            Jira ↗
          </a>
        )}
      </div>

      {expanded && (
        <div className="pt-2 mt-2 border-t border-slate-200 space-y-3">
          {editMode ? (
            <div className="space-y-2">
              <div>
                <Label small>Title</Label>
                <input
                  defaultValue={task.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label small>Owner</Label>
                  <select
                    defaultValue={task.ownerId}
                    onChange={(e) => {
                      const o = roster.find((r) => r.id === e.target.value);
                      if (o) setDraft((d) => ({ ...d, ownerId: o.id, ownerName: o.name }));
                    }}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
                    disabled={!isAdmin}
                  >
                    {roster.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label small>Milestone</Label>
                  <select
                    defaultValue={task.milestone}
                    onChange={(e) => setDraft((d) => ({ ...d, milestone: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
                  >
                    {MILESTONE_IDS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label small>Drive link</Label>
                <input
                  defaultValue={task.driveLink ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, driveLink: e.target.value.trim() || null }))
                  }
                  className="w-full border border-slate-300 rounded px-2 py-1 text-[12px] mono"
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div>
                <Label small>Jira link</Label>
                <input
                  defaultValue={task.jiraLink ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, jiraLink: e.target.value.trim() || null }))
                  }
                  className="w-full border border-slate-300 rounded px-2 py-1 text-[12px] mono"
                  placeholder="https://supervaise.atlassian.net/..."
                />
              </div>
              {isAdmin && (
                <div>
                  <label className="text-[11px] text-ink flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked={task.criticalPath}
                      onChange={(e) => setDraft((d) => ({ ...d, criticalPath: e.target.checked }))}
                    />
                    On critical path
                  </label>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={commitEdit}
                  className="text-[11px] bg-ink text-white px-2 py-1 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setDraft({});
                    setEditMode(false);
                  }}
                  className="text-[11px] text-ink-2 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {canEdit && (
                <div className="flex gap-1.5 flex-wrap">
                  {nextStatuses().map((s) => {
                    const disabled = s === "for_review" && gateForReview;
                    return (
                      <button
                        key={s}
                        disabled={disabled}
                        onClick={() =>
                          onStatus(
                            s,
                            disabled ? undefined : prompt("Note (optional)") ?? undefined
                          )
                        }
                        title={
                          disabled ? "Add a Drive link before moving to For Review" : undefined
                        }
                        className={
                          "text-[10px] px-2 py-1 rounded border transition " +
                          (disabled
                            ? "border-slate-200 text-slate-400 cursor-not-allowed"
                            : "border-slate-300 text-ink hover:bg-slate-100")
                        }
                      >
                        → {STATUS_LABEL[s]}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-[10px] px-2 py-1 rounded border border-slate-300 text-ink hover:bg-slate-100"
                  >
                    ✎ Edit
                  </button>
                  {isAdmin && (
                    <button
                      onClick={onDelete}
                      className="text-[10px] px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}

              {task.driveLink && (
                <div className="text-[11px]">
                  <span className="text-ink-2">Drive: </span>
                  <a
                    href={task.driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline break-all"
                  >
                    {task.driveLink}
                  </a>
                </div>
              )}

              <div className="text-[11px]">
                <div className="text-ink-2 mb-1">Comments ({task.comments.length})</div>
                {task.comments.length > 0 && (
                  <div className="space-y-1 mb-2 max-h-40 overflow-y-auto">
                    {task.comments.map((c) => (
                      <div key={c.id} className="bg-slate-50 rounded p-1.5">
                        <div className="text-[10px] text-ink-2">
                          <span className="font-medium text-ink">{c.author}</span> ·{" "}
                          {new Date(c.at).toLocaleString()}
                        </div>
                        <div className="text-ink whitespace-pre-wrap">{c.text}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-1">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    className="flex-1 border border-slate-300 rounded px-2 py-1 text-[11px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && commentText.trim()) {
                        onComment(commentText.trim());
                        setCommentText("");
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (commentText.trim()) {
                        onComment(commentText.trim());
                        setCommentText("");
                      }
                    }}
                    className="text-[11px] bg-slate-200 px-2 rounded hover:bg-slate-300"
                  >
                    Send
                  </button>
                </div>
              </div>

              <details className="text-[10px] text-ink-2">
                <summary className="cursor-pointer hover:text-ink">
                  Change log ({task.changeLog.length})
                </summary>
                <div className="mt-1 space-y-0.5 pl-2 border-l border-slate-200">
                  {task.changeLog.map((c) => (
                    <div key={c.id}>
                      <span className="text-ink">{c.actor}</span> · {new Date(c.at).toLocaleString()}
                      {c.from && c.to && (
                        <>
                          {" "}
                          · {STATUS_LABEL[c.from]} → {STATUS_LABEL[c.to]}
                        </>
                      )}
                      {c.note && <div className="pl-2 italic">{c.note}</div>}
                    </div>
                  ))}
                </div>
              </details>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Label({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <div
      className={
        small
          ? "text-[10px] uppercase tracking-wider text-ink-2 mb-0.5"
          : "text-[11px] uppercase tracking-wider text-ink-2 mb-1"
      }
    >
      {children}
    </div>
  );
}
