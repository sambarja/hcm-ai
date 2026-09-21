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

export function KRCard({
  kr,
  effectiveGrade,
  override,
  canEdit,
  onSave,
  onClear,
}: {
  kr: KR;
  effectiveGrade: number | null;
  override?: { grade: number; note: string; updatedBy: string; updatedAt: string };
  canEdit: boolean;
  onSave: (grade: number, note: string) => void;
  onClear: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [gradeInput, setGradeInput] = useState<string>(
    effectiveGrade == null ? "" : String(effectiveGrade)
  );
  const [note, setNote] = useState(override?.note ?? "");
  const rag = ragForGrade(effectiveGrade);
  const toneMap = { green: "green", amber: "amber", red: "red", gray: "gray" } as const;

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="mono text-[11px] text-ink-2">{kr.id}</div>
        <div className="flex items-center gap-2">
          <StatusBadge label={kr.type} tone={kr.type === "committed" ? "brand" : "purple"} />
          <StatusBadge
            label={effectiveGrade == null ? "ungraded" : effectiveGrade.toFixed(2)}
            tone={toneMap[rag]}
          />
        </div>
      </div>
      <div className="text-sm text-ink leading-snug mb-2">{kr.description}</div>
      <div className="text-[12px] subtle mb-2">
        <span className="font-medium text-ink">Target:</span> {kr.target}
      </div>
      <div className="text-[11px] subtle">
        Owner: <span className="text-ink">{kr.owner ?? "—"}</span>
      </div>
      {override && (
        <div className="mt-2 text-[11px] bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
          <span className="text-amber-800 font-medium">Live grade</span>{" "}
          <span className="text-ink-2">
            by {override.updatedBy} · {new Date(override.updatedAt).toLocaleString()}
          </span>
          {override.note && <div className="text-ink mt-0.5">{override.note}</div>}
        </div>
      )}
      {canEdit && (
        <div className="pt-3 mt-3 border-t border-slate-100">
          {editing ? (
            <div className="space-y-2 text-[12px]">
              <div className="flex items-end gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-ink-2 mb-0.5">Grade (0.00–1.00)</div>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.05}
                    value={gradeInput}
                    onChange={(e) => setGradeInput(e.target.value)}
                    className="w-24 px-2 py-1 border border-slate-300 rounded mono"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-ink-2 mb-0.5">Note (evidence / caveat)</div>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full border border-slate-300 rounded px-2 py-1"
                  placeholder="e.g. Grade cut 0.6 → 0.4 — leadership approval landed 3 days after target."
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const g = Number(gradeInput);
                    if (Number.isNaN(g) || g < 0 || g > 1) {
                      alert("Grade must be 0.00–1.00");
                      return;
                    }
                    onSave(g, note.trim());
                    setEditing(false);
                  }}
                  disabled={gradeInput === ""}
                  className="bg-ink text-white text-[11px] px-3 py-1 rounded disabled:opacity-40"
                >
                  Save grade
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-[11px] text-ink-2 px-2 py-1"
                >
                  Cancel
                </button>
                {override && (
                  <button
                    onClick={() => {
                      if (confirm("Revert to base grade from key-results.json?")) {
                        onClear();
                        setEditing(false);
                      }
                    }}
                    className="text-[11px] text-red-700 hover:underline ml-auto"
                  >
                    Revert
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] text-blue-700 hover:underline"
            >
              {override ? "Edit grade" : "Set grade"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
