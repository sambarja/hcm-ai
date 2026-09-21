"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useStore, type Concern } from "@/lib/store";
import teamData from "@/data/team.json";
import docsData from "@/data/documents.json";
import type { TeamMember, DocumentEntry } from "@/types";

type Filter = "all" | "open" | "closed" | "mine";

export default function ConcernsPage() {
  const { user, isAdmin } = useAuth();
  const { concerns, tasks, addConcern, respondToConcern } = useStore();
  const [showNew, setShowNew] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const docs = docsData as DocumentEntry[];

  const visible = useMemo(() => {
    switch (filter) {
      case "open":
        return concerns.filter((c) => c.status === "open" || c.status === "acknowledged");
      case "closed":
        return concerns.filter((c) => c.status === "closed" || c.status === "accepted" || c.status === "disputed");
      case "mine":
        return concerns.filter((c) => c.raisedById === user?.id);
      default:
        return concerns;
    }
  }, [concerns, filter, user?.id]);

  return (
    <div>
      <PageHeader
        title="Concerns"
        subtitle="Raise a concern to leadership (Sir Tony + Sir Greg + Sam + Sora). Every concern is checked against prior decisions; contradictions surface here."
        right={
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="text-[12px] border border-slate-300 rounded px-2 py-1"
            >
              <option value="all">All ({concerns.length})</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="mine">Raised by me</option>
            </select>
            <button
              onClick={() => setShowNew((s) => !s)}
              className="text-[13px] bg-ink text-white px-3 py-1.5 rounded hover:bg-slate-800"
            >
              {showNew ? "Cancel" : "+ Raise concern"}
            </button>
          </div>
        }
      />

      {showNew && user && (
        <RaiseConcernForm
          currentUser={user}
          tasks={tasks.map((t) => ({ id: t.id, label: `${t.milestone} · ${t.title}` }))}
          docs={docs.map((d) => ({ id: d.id, label: d.title }))}
          onCancel={() => setShowNew(false)}
          onSubmit={(payload) => {
            addConcern({
              ...payload,
              raisedById: user.id,
              raisedByName: user.name,
            });
            setShowNew(false);
          }}
        />
      )}

      {visible.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded p-12 text-center text-ink-2 text-[13px]">
          No concerns yet. Click <span className="text-ink font-medium">+ Raise concern</span> if
          something worries you about the plan.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((c) => (
            <ConcernCard
              key={c.id}
              concern={c}
              canRespond={isAdmin}
              currentUserId={user?.id ?? ""}
              currentUserName={user?.name ?? ""}
              onRespond={(resp, status) =>
                user &&
                respondToConcern(c.id, resp, { id: user.id, name: user.name }, status)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RaiseConcernForm({
  currentUser,
  tasks,
  docs,
  onSubmit,
  onCancel,
}: {
  currentUser: TeamMember;
  tasks: { id: string; label: string }[];
  docs: { id: string; label: string }[];
  onSubmit: (c: {
    statement: string;
    targetType: Concern["targetType"];
    targetId: string | null;
    impact: string;
    evidenceLink: string | null;
  }) => void;
  onCancel: () => void;
}) {
  const [statement, setStatement] = useState("");
  const [targetType, setTargetType] = useState<Concern["targetType"]>("general");
  const [targetId, setTargetId] = useState<string>("");
  const [impact, setImpact] = useState("");
  const [evidenceLink, setEvidenceLink] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!statement.trim()) return;
    onSubmit({
      statement: statement.trim(),
      targetType,
      targetId: targetType === "general" ? null : targetId || null,
      impact: impact.trim(),
      evidenceLink: evidenceLink.trim() || null,
    });
  }

  const options = targetType === "task" ? tasks : targetType === "document" ? docs : [];

  return (
    <form
      onSubmit={submit}
      className="card mb-6 bg-slate-50 border border-slate-300 space-y-3"
    >
      <div>
        <CLabel>Statement of concern (one sentence)</CLabel>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 rounded px-3 py-2 text-[13px]"
          placeholder="e.g. Freezing rules pack before ADR-003 is closed risks reopening M1."
          autoFocus
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <CLabel>Concern relates to</CLabel>
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value as Concern["targetType"]);
              setTargetId("");
            }}
            className="w-full border border-slate-300 rounded px-3 py-2 text-[13px]"
          >
            <option value="general">General / systemic</option>
            <option value="task">A task</option>
            <option value="document">A document</option>
            <option value="meeting">A meeting</option>
            <option value="milestone">A milestone</option>
          </select>
        </div>
        {(targetType === "task" || targetType === "document") && (
          <div>
            <CLabel>Which {targetType}?</CLabel>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-[13px]"
            >
              <option value="">— select —</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div>
        <CLabel>Expected impact if not addressed</CLabel>
        <textarea
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 rounded px-3 py-2 text-[13px]"
          placeholder="e.g. M1 gate reopens, adding 1–2 weeks."
        />
      </div>
      <div>
        <CLabel>Evidence link (optional)</CLabel>
        <input
          value={evidenceLink}
          onChange={(e) => setEvidenceLink(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="w-full border border-slate-300 rounded px-3 py-2 text-[12px] mono"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={!statement.trim()}
          className="bg-ink text-white text-[13px] px-4 py-1.5 rounded disabled:opacity-40"
        >
          Raise concern
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] text-ink-2 px-3 py-1.5"
        >
          Cancel
        </button>
      </div>
      <p className="text-[11px] text-ink-2">
        Raised by <span className="font-medium">{currentUser.name}</span>. Concern will be routed to
        Sir Tony, Sir Greg, Sam, and Sora. Response expected within five working days.
      </p>
    </form>
  );
}

function ConcernCard({
  concern,
  canRespond,
  currentUserId,
  currentUserName,
  onRespond,
}: {
  concern: Concern;
  canRespond: boolean;
  currentUserId: string;
  currentUserName: string;
  onRespond: (response: string, status: Concern["status"]) => void;
}) {
  const [showResp, setShowResp] = useState(false);
  const [respText, setRespText] = useState("");
  const [respStatus, setRespStatus] = useState<Concern["status"]>("acknowledged");
  const overdueDays = daysSince(concern.createdAt);
  const isOverdue =
    !concern.leadershipResponse && overdueDays >= 5 && concern.status === "open";

  return (
    <div className="card space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] mono text-ink-2 flex items-center gap-2">
            <span>CN · {new Date(concern.createdAt).toLocaleDateString()}</span>
            <span>·</span>
            <span>raised by {concern.raisedByName}</span>
            <span>·</span>
            <span className="uppercase">{concern.targetType}</span>
            {isOverdue && (
              <>
                <span>·</span>
                <span className="text-red-700 font-semibold">
                  Overdue {overdueDays - 5}d past 5d SLA
                </span>
              </>
            )}
          </div>
          <div className="text-[14px] text-ink font-medium mt-1">{concern.statement}</div>
          {concern.impact && (
            <div className="text-[12px] text-ink-2 mt-1">
              <span className="uppercase tracking-wider text-[10px]">Impact: </span>
              {concern.impact}
            </div>
          )}
          {concern.evidenceLink && (
            <a
              href={concern.evidenceLink}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-blue-700 hover:underline"
            >
              Evidence ↗
            </a>
          )}
        </div>
        <span
          className={
            "text-[10px] mono px-1.5 py-0.5 rounded whitespace-nowrap " +
            statusColor(concern.status)
          }
        >
          {concern.status}
        </span>
      </div>

      {concern.leadershipResponse && (
        <div className="border-l-2 border-slate-300 pl-3 mt-2">
          <div className="text-[10px] uppercase tracking-wider text-ink-2">
            Leadership response · {concern.respondedBy} · {new Date(concern.respondedAt!).toLocaleString()}
          </div>
          <div className="text-[13px] text-ink whitespace-pre-wrap">
            {concern.leadershipResponse}
          </div>
        </div>
      )}

      {canRespond && !concern.leadershipResponse && (
        <div className="pt-1">
          {showResp ? (
            <div className="space-y-2 border-t border-slate-200 pt-2">
              <textarea
                value={respText}
                onChange={(e) => setRespText(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
                placeholder="Write leadership response…"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={respStatus}
                  onChange={(e) => setRespStatus(e.target.value as Concern["status"])}
                  className="text-[11px] border border-slate-300 rounded px-2 py-1"
                >
                  <option value="acknowledged">Acknowledged & investigating</option>
                  <option value="accepted">Accepted — action assigned</option>
                  <option value="disputed">Disputed — reason given</option>
                  <option value="deferred">Deferred to later review</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={() => {
                    if (respText.trim()) {
                      onRespond(respText.trim(), respStatus);
                      setRespText("");
                      setShowResp(false);
                    }
                  }}
                  disabled={!respText.trim()}
                  className="text-[11px] bg-ink text-white px-3 py-1 rounded disabled:opacity-40"
                >
                  Post response
                </button>
                <button
                  onClick={() => setShowResp(false)}
                  className="text-[11px] text-ink-2 px-2 py-1"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[10px] text-ink-2">
                Responding as {currentUserName}.
              </p>
            </div>
          ) : (
            <button
              onClick={() => setShowResp(true)}
              className="text-[11px] text-blue-700 hover:underline"
            >
              Respond as leadership
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function statusColor(s: Concern["status"]) {
  switch (s) {
    case "open":
      return "bg-amber-100 text-amber-800";
    case "acknowledged":
      return "bg-blue-100 text-blue-800";
    case "accepted":
      return "bg-green-100 text-green-800";
    case "disputed":
      return "bg-red-100 text-red-800";
    case "deferred":
      return "bg-slate-200 text-slate-700";
    case "closed":
      return "bg-slate-100 text-slate-600";
  }
}

function daysSince(iso: string): number {
  const then = new Date(iso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

function CLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-wider text-ink-2 mb-1">{children}</div>
  );
}
