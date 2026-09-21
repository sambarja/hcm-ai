"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import teamData from "@/data/team.json";
import type { TeamMember } from "@/types";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const roster = teamData as TeamMember[];
  const { signIn } = useAuth();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>(roster[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = signIn(selectedId);
    if (!found) {
      setError("Member not found");
      return;
    }
    router.replace("/");
  }

  const admins = roster.filter((m) => m.accessLevel === "Admin");
  const members = roster.filter((m) => m.accessLevel === "Member");

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold text-ink">HCM AI</div>
          <div className="text-[13px] text-ink-2 mt-1">Programme Management Dashboard</div>
        </div>
        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="mb-4">
            <label className="block text-[12px] uppercase tracking-wider text-ink-2 mb-2">
              Sign in as
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-[14px] text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <optgroup label="Admins">
                {admins.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.role}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Members">
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.role}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          {error && <div className="text-[12px] text-red-600 mb-3">{error}</div>}
          <button
            type="submit"
            className="w-full bg-ink text-white text-[14px] font-medium py-2 rounded hover:bg-slate-800 transition-colors"
          >
            Sign in
          </button>
          <p className="text-[11px] text-ink-2 mt-4 leading-relaxed">
            Stub auth — roster from <code className="mono">src/data/team.json</code>. Replace with
            Clerk when Phase 2 auth lands. Admins can assign tasks and close issues; Members can
            view all and update their own.
          </p>
        </form>
      </div>
    </div>
  );
}
