import { db } from "@/lib/db";
import { risks } from "@/db/schema";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function RisksPage() {
  const rows = await db.select().from(risks);
  return (
    <div>
      <PageHeader
        title="Risk register"
        subtitle="Ten failure modes from Work Plan §9.1. Each has an early sign, a mitigation the plan carries, and an escalation."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="text-[15px] font-semibold text-ink leading-snug">{r.mode}</div>
              <div className="flex flex-col gap-1 items-end">
                {r.severity && (
                  <StatusBadge
                    label={r.severity}
                    tone={r.severity === "Critical" ? "red" : r.severity === "Major" ? "amber" : "gray"}
                  />
                )}
                {r.realised && <StatusBadge label="realised" tone="red" />}
                {r.milestoneId && <StatusBadge label={r.milestoneId} tone="brand" />}
              </div>
            </div>
            <Section title="Early sign" body={r.earlySign} />
            <Section title="Mitigation" body={r.mitigation} />
            <Section title="Escalation" body={r.escalation} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-2">
      <div className="text-[10px] uppercase tracking-wider text-ink-2">{title}</div>
      <div className="text-[13px] text-ink leading-snug">{body}</div>
    </div>
  );
}
