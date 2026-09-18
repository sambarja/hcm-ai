import { db } from "@/lib/db";
import { milestones } from "@/db/schema";
import { PageHeader } from "@/components/PageHeader";
import { MilestoneCard } from "@/components/MilestoneCard";

export const dynamic = "force-dynamic";

const ORDER = ["M0", "M1", "M2", "M3", "M4", "M5", "MR"] as const;

export default async function MilestonesPage() {
  const rows = await db.select().from(milestones);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const sorted = ORDER.map((id) => byId.get(id)).filter(Boolean) as typeof rows;

  return (
    <div>
      <PageHeader
        title="Milestones"
        subtitle="M0 pre-freeze through M5 acceptance, plus the on-demand rehearsal MR. Deliverable / oracle / exit each stated."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((m) => (
          <MilestoneCard key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}
