"use client";

import { useState } from "react";
import { ragForGrade } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";

type KR = {
  id: string;
  krNumber: string;
  description: string;
  target: string;
  type: "committed" | "aspirational";
  grade: number | null;
  owner: string | null;
};

export function KRCard({ kr }: { kr: KR }) {
  // Phase 1: client-side edit only, no persistence.
  const [grade, setGrade] = useState<number | null>(kr.grade ?? null);
  const rag = ragForGrade(grade);
  const toneMap = { green: "green", amber: "amber", red: "red", gray: "gray" } as const;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="mono text-[11px] text-ink-2">{kr.id}</div>
        <div className="flex items-center gap-2">
          <StatusBadge label={kr.type} tone={kr.type === "committed" ? "brand" : "purple"} />
          <StatusBadge
            label={grade == null ? "ungraded" : grade.toFixed(2)}
            tone={toneMap[rag]}
          />
        </div>
      </div>
      <div className="text-sm text-ink leading-snug mb-2">{kr.description}</div>
      <div className="text-[12px] subtle mb-3">
        <span className="font-medium text-ink">Target:</span> {kr.target}
      </div>
      <div className="flex items-center gap-3 text-[12px]">
        <label className="subtle">Grade</label>
        <input
          type="number"
          min={0}
          max={1}
          step={0.05}
          value={grade ?? ""}
          onChange={(e) => setGrade(e.target.value === "" ? null : Number(e.target.value))}
          className="w-20 px-2 py-1 border border-slate-200 rounded-md mono text-[12px]"
          placeholder="0.00"
        />
        <span className="ml-auto text-[11px] subtle">
          Owner: <span className="text-ink">{kr.owner ?? "—"}</span>
        </span>
      </div>
    </div>
  );
}
