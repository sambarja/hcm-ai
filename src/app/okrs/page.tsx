import { db } from "@/lib/db";
import { objectives, keyResults } from "@/db/schema";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/PageHeader";
import { KRCard } from "@/components/KRCard";

export const dynamic = "force-dynamic";

export default async function OkrsPage() {
  const [objs, krs] = await Promise.all([
    db.select().from(objectives).orderBy(asc(objectives.id)),
    db.select().from(keyResults).orderBy(asc(keyResults.id)),
  ]);

  return (
    <div>
      <PageHeader
        title="OKRs · Pre-M1 (Q3 2026)"
        subtitle="5 objectives, 21 key results. Grade is client-side in Phase 1 — grades do not persist until Phase 2."
      />
      <div className="space-y-8">
        {objs.map((o) => {
          const rows = krs.filter((k) => k.objectiveId === o.id);
          return (
            <section key={o.id}>
              <div className="mb-3">
                <div className="mono text-[11px] text-ink-2">OBJECTIVE {o.id}</div>
                <h2 className="text-[16px] font-semibold text-ink leading-snug">{o.title}</h2>
                {o.description && <p className="text-[13px] subtle mt-1">{o.description}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rows.map((k) => (
                  <KRCard
                    key={k.id}
                    kr={{
                      id: k.id,
                      krNumber: k.krNumber,
                      description: k.description,
                      target: k.target,
                      type: k.type,
                      grade: k.grade,
                      owner: k.owner,
                    }}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
