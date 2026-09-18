import { differenceInCalendarDays, addMonths, startOfMonth, format } from "date-fns";
import { ragFor, toDate } from "@/lib/utils";

type Row = {
  id: string;
  label: string;
  start: Date | string | null;
  end: Date | string | null;
  status: string;
  critical: boolean;
};

const RAG_FILL: Record<string, string> = {
  green: "var(--green)",
  amber: "var(--amber)",
  red: "var(--red)",
  gold: "var(--gold)",
  gray: "#94a3b8",
};

export function GanttChart({ rows }: { rows: Row[] }) {
  const today = new Date();
  const chartStart = startOfMonth(today);
  const chartEnd = addMonths(chartStart, 12);
  const totalDays = differenceInCalendarDays(chartEnd, chartStart);
  const width = 1120;
  const rowHeight = 30;
  const labelWidth = 260;
  const headerHeight = 40;
  const height = headerHeight + rows.length * rowHeight + 12;

  const dayToX = (d: Date) => {
    const clamped = Math.max(0, Math.min(totalDays, differenceInCalendarDays(d, chartStart)));
    return labelWidth + (clamped / totalDays) * (width - labelWidth - 16);
  };

  const monthTicks: { x: number; label: string }[] = [];
  for (let i = 0; i <= 12; i++) {
    const d = addMonths(chartStart, i);
    monthTicks.push({ x: dayToX(d), label: format(d, "MMM ''yy") });
  }
  const todayX = dayToX(today);

  return (
    <div className="card overflow-x-auto">
      <svg width={width} height={height} className="block min-w-full">
        {/* Month grid + labels */}
        {monthTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x}
              x2={t.x}
              y1={headerHeight - 10}
              y2={height - 6}
              stroke="#E2E8F0"
              strokeWidth={1}
            />
            <text
              x={t.x + 3}
              y={headerHeight - 14}
              fontSize={10}
              fill="var(--ink-2)"
              className="mono"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* Today marker */}
        <line x1={todayX} x2={todayX} y1={headerHeight - 10} y2={height - 6} stroke="var(--brand)" strokeWidth={1.5} strokeDasharray="4 3" />
        <text x={todayX + 4} y={headerHeight - 2} fontSize={10} fill="var(--brand)" className="mono">
          today
        </text>

        {/* Rows */}
        {rows.map((r, i) => {
          const y = headerHeight + i * rowHeight;
          const start = toDate(r.start) ?? today;
          const end = toDate(r.end) ?? addMonths(start, 1);
          const x0 = dayToX(start);
          const x1 = dayToX(end);
          const w = Math.max(4, x1 - x0);
          const fill = RAG_FILL[ragFor(r.status)];
          return (
            <g key={r.id}>
              <text
                x={12}
                y={y + rowHeight / 2 + 4}
                fontSize={12}
                fill="var(--ink)"
                className="font-medium"
              >
                <tspan className="mono" fill="var(--ink-2)">{r.id}</tspan>
                <tspan dx={8}>{r.label.length > 34 ? r.label.slice(0, 34) + "…" : r.label}</tspan>
              </text>
              <rect
                x={labelWidth}
                y={y + 6}
                width={width - labelWidth - 16}
                height={rowHeight - 12}
                fill="#F1F5F9"
                rx={4}
              />
              <rect
                x={x0}
                y={y + 6}
                width={w}
                height={rowHeight - 12}
                fill={fill}
                rx={4}
                opacity={r.critical ? 1 : 0.65}
                stroke={r.critical ? "var(--ink)" : "none"}
                strokeWidth={r.critical ? 1 : 0}
              />
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 text-[11px] mt-2 subtle">
        <span>
          <span className="inline-block w-3 h-2 rounded-sm mr-1" style={{ background: "var(--green)" }} />
          Done
        </span>
        <span>
          <span className="inline-block w-3 h-2 rounded-sm mr-1" style={{ background: "var(--amber)" }} />
          In progress / at risk
        </span>
        <span>
          <span className="inline-block w-3 h-2 rounded-sm mr-1" style={{ background: "var(--red)" }} />
          Blocked
        </span>
        <span>
          <span className="inline-block w-3 h-2 rounded-sm mr-1 border border-ink" style={{ background: "#94a3b8" }} />
          On critical path
        </span>
      </div>
    </div>
  );
}
