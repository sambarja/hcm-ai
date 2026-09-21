"use client";

import { useState } from "react";
import msData from "@/data/milestones.json";
import type { Milestone, MilestoneId } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { daysUntil, fmtDate, ragFor } from "@/lib/utils";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { useStore, type MilestoneStatus, type Rag } from "@/lib/store";

const ORDER: MilestoneId[] = ["M0", "M1", "M2", "M3", "M4", "M5", "MR"];
const STATUS_OPTIONS: MilestoneStatus[] = [
  "not_started",
  "in_progress",
  "at_risk",
  "blocked",
  "done",
  "deferred",
];
const RAG_OPTIONS: Rag[] = ["green", "amber", "red", "gold", "gray"];

export default function MilestonesPage() {
  const { user, isAdmin } = useAuth();
  const { milestoneOverrides, setMilestoneOverride, clearMilestoneOverride } = useStore();
  const rows = msData as Milestone[];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const sorted = ORDER.map((id) => byId.get(id)).filter((m): m is Milestone => Boolean(m));

  return (
    <div>
      <PageHeader
        title="Milestones"
        subtitle="M0 pre-freeze through M5 acceptance, plus the on-demand rehearsal MR. Admins can override status + RAG live — everyone sees the same view."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((m) => {
          const override = milestoneOverrides[m.id];
          const status = override?.status ?? (m.status as MilestoneStatus);
          const rag = override?.rag ?? ragFor(m.status);
          return (
            <MilestoneCard
              key={m.id}
              m={m}
              effectiveStatus={status}
              effectiveRag={rag}
              override={override}
              canEdit={isAdmin}
              onSave={(patch) =>
                user &&
                setMilestoneOverride(m.id, {
                  status: patch.status,
                  rag: patch.rag,
                  note: patch.note,
                  updatedBy: user.name,
                })
              }
              onClear={() => clearMilestoneOverride(m.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

function MilestoneCard({
  m,
  effectiveStatus,
  effectiveRag,
  override,
  canEdit,
  onSave,
  onClear,
}: {
  m: Milestone;
  effectiveStatus: MilestoneStatus;
  effectiveRag: Rag;
  override?: { status: MilestoneStatus; rag: Rag; note: string; updatedBy: string; updatedAt: string };
  canEdit: boolean;
  onSave: (patch: { status: MilestoneStatus; rag: Rag; note: string }) => void;
  onClear: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<MilestoneStatus>(effectiveStatus);
  const [rag, setRag] = useState<Rag>(effectiveRag);
  const [note, setNote] = useState(override?.note ?? "");
  const toneMap = { green: "green", amber: "amber", red: "red", gray: "gray", gold: "gold" } as const;
  const remaining = daysUntil(m.targetDate);

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="mono text-[11px] text-ink-2">{m.id}</div>
          <div className="text-[15px] font-semibold text-ink">{m.name}</div>
          <div className="text-[11px] subtle mt-0.5">Weeks from NTP: {m.weeksFromNtp}</div>
        </div>
        <StatusBadge label={effectiveStatus.replace("_", " ")} tone={toneMap[effectiveRag]} />
      </div>
      <div className="grid grid-cols-1 gap-2 text-[13px] mt-3">
        <Row label="Deliverable" v={m.deliverable} />
        <Row label="Oracle" v={m.acceptanceOracle ?? "—"} />
        <Row label="Exit" v={m.exitCondition ?? "—"} />
      </div>
      {override && (
        <div className="mt-3 text-[11px] bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          <span className="text-amber-800 font-medium">Live override</span>{" "}
          <span className="text-ink-2">
            by {override.updatedBy} · {new Date(override.updatedAt).toLocaleString()}
          </span>
          {override.note && <div className="text-ink mt-0.5">{override.note}</div>}
        </div>
      )}
      <div className="flex items-center justify-between text-[12px] pt-3 mt-3 border-t border-slate-100">
        <span className="subtle">
          Target: <span className="mono text-ink">{fmtDate(m.targetDate)}</span>
        </span>
        <span className="mono text-ink-2">
          {remaining == null ? "—" : remaining >= 0 ? `${remaining}d remaining` : `${-remaining}d overdue`}
        </span>
      </div>
      {canEdit && (
        <div className="pt-3 mt-3 border-t border-slate-100">
          {editing ? (
            <div className="space-y-2 text-[12px]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <MLabel>Status</MLabel>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MilestoneStatus)}
                    className="w-full border border-slate-300 rounded px-2 py-1"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <MLabel>RAG</MLabel>
                  <select
                    value={rag}
                    onChange={(e) => setRag(e.target.value as Rag)}
                    className="w-full border border-slate-300 rounded px-2 py-1"
                  >
                    {RAG_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <MLabel>Note (why the change)</MLabel>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  className="w-full border border-slate-300 rounded px-2 py-1"
                  placeholder="e.g. Slipped 1 week — evidence pack pending Sora sign-off."
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSave({ status, rag, note: note.trim() });
                    setEditing(false);
                  }}
                  className="bg-ink text-white text-[11px] px-3 py-1 rounded"
                >
                  Save override
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-[11px] text-ink-2 px-2 py-1"
                >
                  Cancel
                </button>
                {override && (
                  <button
                    onClick={() => {
                      if (confirm("Revert to base value from milestones.json?")) {
                        onClear();
                        setEditing(false);
                      }
                    }}
                    className="text-[11px] text-red-700 hover:underline ml-auto"
                  >
                    Revert override
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] text-blue-700 hover:underline"
            >
              {override ? "Edit override" : "Set status / RAG override"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex gap-2">
      <div className="w-20 shrink-0 text-[11px] uppercase tracking-wide text-ink-2">{label}</div>
      <div className="text-ink">{v}</div>
    </div>
  );
}

function MLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-ink-2 mb-0.5">{children}</div>
  );
}
