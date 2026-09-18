import { db } from "@/lib/db";
import { milestones, criticalPathTasks } from "@/db/schema";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/PageHeader";
import { GanttChart } from "@/components/GanttChart";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const [ms, cpt] = await Promise.all([
    db.select().from(milestones),
    db.select().from(criticalPathTasks).orderBy(asc(criticalPathTasks.orderIx)),
  ]);

  const msRows = ms
    .filter((m) => m.targetDate)
    .map((m) => ({
      id: m.id,
      label: m.name,
      start: m.createdAt ?? new Date(),
      end: m.targetDate,
      status: m.status,
      critical: false,
    }));

  const cptRows = cpt.map((c) => ({
    id: `T${c.orderIx}`,
    label: c.task,
    start: c.plannedStart ?? c.actualStart ?? null,
    end: c.plannedFinish ?? c.actualFinish ?? null,
    status: c.status,
    critical: c.onCriticalPath,
  }));

  return (
    <div>
      <PageHeader
        title="Timeline"
        subtitle="Milestones M0–MR and critical-path tasks over the next twelve months. Today marked in blue."
      />
      <h2 className="text-[13px] uppercase tracking-wider text-ink-2 mb-2">Milestones</h2>
      <GanttChart rows={msRows} />
      <h2 className="text-[13px] uppercase tracking-wider text-ink-2 mt-8 mb-2">Critical-path tasks</h2>
      <GanttChart rows={cptRows} />
    </div>
  );
}
