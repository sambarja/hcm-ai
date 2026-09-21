"use client";

import objData from "@/data/objectives.json";
import krData from "@/data/key-results.json";
import type { Objective, KeyResult } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { KRCard } from "@/components/KRCard";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

export default function OkrsPage() {
  const { user, isAdmin } = useAuth();
  const { okrGrades, setOkrGrade, clearOkrGrade } = useStore();
  const objs = [...(objData as Objective[])].sort((a, b) => a.id - b.id);
  const krs = [...(krData as KeyResult[])].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div>
      <PageHeader
        title="OKRs · Pre-M1 (Q3 2026)"
        subtitle="5 objectives, 21 key results. Admins can grade live — everyone sees the same view. Base grades come from key-results.json."
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
                {rows.map((k) => {
                  const override = okrGrades[k.id];
                  const effectiveGrade = override?.grade ?? k.grade;
                  return (
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
                      effectiveGrade={effectiveGrade}
                      override={override}
                      canEdit={isAdmin}
                      onSave={(grade, note) =>
                        user &&
                        setOkrGrade(k.id, {
                          grade,
                          note,
                          updatedBy: user.name,
                        })
                      }
                      onClear={() => clearOkrGrade(k.id)}
                    />
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
