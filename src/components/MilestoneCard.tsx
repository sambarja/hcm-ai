import { daysUntil, fmtDate, ragFor } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

type Milestone = {
  id: string;
  name: string;
  weeksFromNtp: string;
  targetDate: Date | null;
  deliverable: string;
  acceptanceOracle: string | null;
  exitCondition: string | null;
  status: string;
};

export function MilestoneCard({ m }: { m: Milestone }) {
  const rag = ragFor(m.status);
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
        <StatusBadge label={m.status.replace("_", " ")} tone={toneMap[rag]} />
      </div>
      <div className="grid grid-cols-1 gap-2 text-[13px] mt-3">
        <Row label="Deliverable" v={m.deliverable} />
        <Row label="Oracle" v={m.acceptanceOracle ?? "—"} />
        <Row label="Exit" v={m.exitCondition ?? "—"} />
      </div>
      <div className="flex items-center justify-between text-[12px] pt-3 mt-3 border-t border-slate-100">
        <span className="subtle">
          Target: <span className="mono text-ink">{fmtDate(m.targetDate)}</span>
        </span>
        <span className="mono text-ink-2">
          {remaining == null ? "—" : remaining >= 0 ? `${remaining}d remaining` : `${-remaining}d overdue`}
        </span>
      </div>
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
