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
        title="Blocker register (archive)"
        subtitle="Legacy KR 4.4 register. Live blockers are now tracked as tasks with status = Blocked."
      />
      <div className="mb-6 border border-amber-300 bg-amber-50 rounded p-4 text-[13px]">
        <div className="font-semibold text-amber-900 mb-1">This register has been folded into Tasks.</div>
        <div className="text-ink">
          A blocker is a task that can't move. Raise one under{" "}
          <a href="/tasks" className="text-blue-700 hover:underline font-medium">
            Tasks
          </a>{" "}
          and set its status to <span className="mono">Blocked</span>. The entries below are read-only
          history from the original static register.
        </div>
      </div>
      <DataTable columns={cols} rows={rows} rowClassName={rowClassName} />
    </div>
  );
}
