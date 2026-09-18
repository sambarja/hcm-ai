import msData from "@/data/milestones.json";
import type { Milestone, MilestoneId } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { MilestoneCard } from "@/components/MilestoneCard";

const ORDER: MilestoneId[] = ["M0", "M1", "M2", "M3", "M4", "M5", "MR"];

export default function MilestonesPage() {
  const rows = msData as Milestone[];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const sorted = ORDER.map((id) => byId.get(id)).filter((m): m is Milestone => Boolean(m));

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
