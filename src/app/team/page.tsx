import teamData from "@/data/team.json";
import type { TeamMember } from "@/types";
import { PageHeader } from "@/components/PageHeader";

export default function TeamPage() {
  const rows = teamData as TeamMember[];
  return (
    <div>
      <PageHeader title="Team" subtitle="Named accountability. Roles map to Work Plan §11." />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((t) => (
          <div key={t.id} className="card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="text-[15px] font-semibold text-ink">{t.name}</div>
                <div className="text-[12px] subtle">{t.role}</div>
              </div>
              <div className="text-[10px] mono text-ink-2">{t.timezone ?? "—"}</div>
            </div>
            <div className="text-[12px] space-y-1">
              {t.krsOwned && (
                <Row label="KRs" v={t.krsOwned} />
              )}
              {t.primaryWorkbook && <Row label="Workbook" v={t.primaryWorkbook} />}
              {t.reportsTo && <Row label="Reports to" v={t.reportsTo} />}
              {t.contact && <Row label="Contact" v={t.contact} />}
              {t.notes && <Row label="Notes" v={t.notes} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ label, v }: { label: string; v: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-[10px] uppercase tracking-wider text-ink-2 w-16 shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-ink">{v}</span>
    </div>
  );
}
