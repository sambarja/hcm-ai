import risksData from "@/data/risks.json";
import type { Risk } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

export default function RisksPage() {
  const rows = risksData as Risk[];
  return (
    <div>
      <PageHeader
        title="Risk register (reference)"
        subtitle="Ten pre-committed failure modes from Work Plan §9.1. Live risks are now raised as concerns."
      />
      <div className="mb-6 border border-amber-300 bg-amber-50 rounded p-4 text-[13px]">
        <div className="font-semibold text-amber-900 mb-1">This register is reference-only.</div>
        <div className="text-ink">
          A newly emerging risk is a concern. Raise one under{" "}
          <a href="/concerns" className="text-blue-700 hover:underline font-medium">
            Concerns
          </a>
          . The cards below stay as the pre-committed reference set from the plan.
        </div>
      </div>
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
