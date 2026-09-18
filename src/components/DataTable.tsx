import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type Column<T> = {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T) => ReactNode;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  rowClassName,
  emptyLabel = "No rows.",
}: {
  columns: Column<T>[];
  rows: T[];
  rowClassName?: (row: T) => string | undefined;
  emptyLabel?: string;
}) {
  return (
    <div className="card p-0 overflow-x-auto">
      <table className="data">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className={c.className}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="text-center subtle py-6">
                {emptyLabel}
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={i} className={cn(rowClassName?.(r))}>
              {columns.map((c) => (
                <td key={String(c.key)} className={c.className}>
                  {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key as string] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
