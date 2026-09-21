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
        title="Stand-up log (archive)"
        subtitle="Daily async log. Superseded by the Monday sprint minute for the 8-person team."
      />
      <div className="mb-6 border border-amber-300 bg-amber-50 rounded p-4 text-[13px]">
        <div className="font-semibold text-amber-900 mb-1">The daily stand-up has been retired.</div>
        <div className="text-ink">
          For an 8-person team, the Monday 11:00 sprint minute is the cadence.{" "}
          <a href="/meetings" className="text-blue-700 hover:underline font-medium">
            Sprint Meetings
          </a>{" "}
          captures moved / blocked / next per person as part of the minute. Old entries stay here for
          reference.
        </div>
      </div>
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
