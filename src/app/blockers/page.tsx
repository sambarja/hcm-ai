import blockerData from "@/data/blockers.json";
import type { Blocker } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { businessDaysSince, fmtDate } from "@/lib/utils";

type Row = Blocker;

export default function BlockersPage() {
  const rows = [...(blockerData as Blocker[])].sort((a, b) => a.raisedAt.localeCompare(b.raisedAt));

  const cols: Column<Row>[] = [
    { key: "id", header: "ID", className: "mono text-[11px] text-ink-2 w-28" },
    { key: "description", header: "Description" },
    {
      key: "relatedKrId",
      header: "KR",
      className: "mono text-[11px] w-20",
      render: (r) => r.relatedKrId ?? "—",
    },
    { key: "owner", header: "Owner", className: "w-24" },
    {
      key: "raisedAt",
      header: "Raised",
      className: "mono text-[11px] w-24",
      render: (r) => fmtDate(r.raisedAt),
    },
    {
      key: "targetResolveBy",
      header: "Target",
      className: "mono text-[11px] w-24",
      render: (r) => fmtDate(r.targetResolveBy),
    },
    {
      key: "aging",
      header: "Days open",
      className: "w-20",
      render: (r) => {
        if (r.resolvedAt) return <span className="subtle">closed</span>;
        const d = businessDaysSince(r.raisedAt);
        return (
          <span className={"mono " + ((d ?? 0) > 2 ? "text-red font-semibold" : "text-ink-2")}>
            {d ?? "—"}
          </span>
        );
      },
    },
    {
      key: "escalated",
      header: "Escalated",
      className: "w-24",
      render: (r) => (r.escalated ? <StatusBadge label="yes" tone="red" /> : <span className="subtle text-[12px]">no</span>),
    },
  ];

  const rowClassName = (r: Row) => {
    if (r.resolvedAt) return "opacity-60";
    const d = businessDaysSince(r.raisedAt) ?? 0;
    return d > 2 ? "bg-red-soft/30" : "";
  };

  return (
    <div>
      <PageHeader
        title="Blocker register (KR 4.4)"
        subtitle="Escalated when aging past two working days on the critical chain. Aging is computed at render time."
      />
      <DataTable columns={cols} rows={rows} rowClassName={rowClassName} />
    </div>
  );
}
