import krData from "@/data/key-results.json";
import msData from "@/data/milestones.json";
import blockerData from "@/data/blockers.json";
import docsData from "@/data/documents.json";
import adrData from "@/data/adrs.json";
import type { KeyResult, Milestone, Blocker, DocumentEntry, Adr } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { daysUntil, fmtDate, toDate } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const krs = krData as KeyResult[];
  const mss = msData as Milestone[];
  const openBlockers = (blockerData as Blocker[]).filter((b) => !b.resolvedAt);
  const docs = docsData as DocumentEntry[];
  const recentAdrs = [...(adrData as Adr[])]
    .sort((a, b) => {
      const ax = a.effectiveDate ? new Date(a.effectiveDate).getTime() : 0;
      const bx = b.effectiveDate ? new Date(b.effectiveDate).getTime() : 0;
      return bx - ax;
    })
    .slice(0, 5);

  const green = krs.filter((k) => (k.grade ?? 0) >= 0.7).length;
  const amber = krs.filter((k) => (k.grade ?? 0) >= 0.4 && (k.grade ?? 0) < 0.7).length;
  const red = krs.filter((k) => k.grade != null && k.grade < 0.4).length;
  const ungraded = krs.filter((k) => k.grade == null).length;

  const m1 = mss.find((m) => m.id === "M1");
  const daysToM1 = daysUntil(m1?.targetDate ?? null);
  const staleDocs = docs.filter((d) => {
    const t = toDate(d.lastTouched);
    if (!t) return false;
    const now = Date.now();
    return (now - t.getTime()) / (1000 * 60 * 60 * 24) > 21;
  }).length;

  const upcoming = mss
    .filter((m) => {
      const t = toDate(m.targetDate);
      return t != null && t.getTime() - Date.now() >= -1000 * 60 * 60 * 24;
    })
    .sort((a, b) => toDate(a.targetDate)!.getTime() - toDate(b.targetDate)!.getTime())
    .slice(0, 3);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="One view. Every register. Rendered from static JSON — edit src/data/*.json to update." />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Tile label="KRs on track" value={green} tone="green" hint={`of ${krs.length}`} />
        <Tile label="KRs at risk" value={amber} tone="amber" />
        <Tile label="KRs off track" value={red} tone="red" hint={`${ungraded} ungraded`} />
        <Tile
          label="Days to M1"
          value={daysToM1 == null ? "—" : daysToM1}
          tone={daysToM1 != null && daysToM1 < 30 ? "red" : "brand"}
        />
        <Tile
          label="Open blockers"
          value={openBlockers.length}
          tone={openBlockers.length > 0 ? "amber" : "green"}
          hint={`${staleDocs} docs stale`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <h2 className="text-[15px] font-semibold text-ink mb-3">Next 3 milestones</h2>
          <div className="space-y-3">
            {upcoming.map((m) => (
              <div key={m.id} className="card">
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="mono text-[11px] text-ink-2 mr-2">{m.id}</span>
                    <span className="font-medium">{m.name}</span>
                  </div>
                  <span className="mono text-[12px] text-ink-2">{fmtDate(m.targetDate)}</span>
                </div>
                <div className="text-[12px] subtle">{m.deliverable}</div>
              </div>
            ))}
            {upcoming.length === 0 && <div className="subtle text-sm">No upcoming milestones seeded.</div>}
          </div>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-ink mb-3">Recent decisions (ADRs)</h2>
          <div className="space-y-2">
            {recentAdrs.length === 0 && <div className="subtle text-sm">No ADRs seeded.</div>}
            {recentAdrs.map((a) => (
              <div key={a.id} className="card py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="mono text-[11px] text-ink-2 mr-2">{a.id}</span>
                    <span className="font-medium">{a.title}</span>
                  </div>
                  <StatusBadge label={a.status} tone={a.status === "Accepted" ? "green" : "gold"} />
                </div>
                <div className="text-[12px] subtle mt-1 line-clamp-2">{a.decision}</div>
              </div>
            ))}
          </div>

          <h2 className="text-[15px] font-semibold text-ink mt-6 mb-3">Aging blockers (top 5)</h2>
          <div className="space-y-2">
            {openBlockers.slice(0, 5).map((b) => (
              <Link href="/blockers" key={b.id} className="card block py-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="mono text-[11px] text-ink-2 mr-2">{b.id}</span>
                    {b.description}
                  </div>
                  {b.escalated && <StatusBadge label="escalated" tone="red" />}
                </div>
              </Link>
            ))}
            {openBlockers.length === 0 && <div className="subtle text-sm">No open blockers.</div>}
          </div>
        </section>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string | number;
  tone: "green" | "amber" | "red" | "brand";
  hint?: string;
}) {
  const bar: Record<string, string> = {
    green: "var(--green)",
    amber: "var(--amber)",
    red: "var(--red)",
    brand: "var(--brand)",
  };
  return (
    <div className="card relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: bar[tone] }} />
      <div className="pl-2">
        <div className="text-[11px] uppercase tracking-wider text-ink-2">{label}</div>
        <div className="text-[26px] font-semibold text-ink leading-tight">{value}</div>
        {hint && <div className="text-[11px] subtle mt-1">{hint}</div>}
      </div>
    </div>
  );
}
