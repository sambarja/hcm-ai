import standupData from "@/data/standups.json";
import type { StandupEntry } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { fmtDate } from "@/lib/utils";

export default function StandupPage() {
  const rows = [...(standupData as StandupEntry[])].sort((a, b) => b.date.localeCompare(a.date));

  const byDate = new Map<string, StandupEntry[]>();
  for (const r of rows) {
    const key = fmtDate(r.date);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(r);
  }

  return (
    <div>
      <PageHeader
        title="Written stand-up log"
        subtitle="Async, before 10:00 local. Replaces spoken stand-up (Work Plan §7.1). One entry per owner per day."
      />
      <div className="space-y-6">
        {[...byDate.entries()].map(([date, entries]) => (
          <section key={date}>
            <div className="mono text-[12px] text-ink-2 mb-2">{date}</div>
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e.id} className="card">
                  <div className="flex items-baseline gap-2 mb-2">
                    <div className="text-[13px] font-semibold text-ink">{e.owner}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
                    <Field label="Moved" v={e.moved} tone="green" />
                    <Field label="Blocked" v={e.blocked ?? "—"} tone="red" />
                    <Field label="Next" v={e.next} tone="brand" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {rows.length === 0 && <div className="subtle text-sm">No stand-up entries seeded.</div>}
      </div>
    </div>
  );
}

function Field({ label, v, tone }: { label: string; v: string; tone: "green" | "red" | "brand" }) {
  const c: Record<string, string> = {
    green: "var(--green)",
    red: "var(--red)",
    brand: "var(--brand)",
  };
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: c[tone] }}>
        {label}
      </div>
      <div className="text-ink">{v}</div>
    </div>
  );
}
