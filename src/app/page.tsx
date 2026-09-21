"use client";

import { useMemo } from "react";
import Link from "next/link";
import msData from "@/data/milestones.json";
import type { Milestone } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { daysUntil, fmtDate, toDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useStore, STATUS_LABEL, STATUS_COLOR } from "@/lib/store";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function thisMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const back = day === 0 ? 6 : day - 1;
  const d = new Date(now);
  d.setDate(now.getDate() - back);
  d.setHours(0, 0, 0, 0);
  return isoDate(d);
}

function nextMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const forward = (1 - day + 7) % 7 || 7;
  const d = new Date(now);
  d.setDate(now.getDate() + forward);
  d.setHours(0, 0, 0, 0);
  return isoDate(d);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { tasks, concerns, meetings, milestoneOverrides } = useStore();
  const mss = msData as Milestone[];

  const m1 = mss.find((m) => m.id === "M1");
  const daysToM1 = daysUntil(m1?.targetDate ?? null);

  const openConcerns = useMemo(
    () => concerns.filter((c) => c.status === "open" || c.status === "acknowledged"),
    [concerns]
  );
  const myTasks = useMemo(() => tasks.filter((t) => t.ownerId === user?.id), [tasks, user?.id]);
  const blockedTasks = useMemo(() => tasks.filter((t) => t.status === "blocked"), [tasks]);
  const forReview = useMemo(() => tasks.filter((t) => t.status === "for_review"), [tasks]);

  const monday = thisMonday();
  const nextMon = nextMonday();
  const currentMinute = meetings.find((m) => m.meetingDate === monday);
  const nextMinute = meetings.find((m) => m.meetingDate === nextMon);

  const upcoming = mss
    .filter((m) => {
      const t = toDate(m.targetDate);
      return t != null && t.getTime() - Date.now() >= -1000 * 60 * 60 * 24;
    })
    .sort((a, b) => toDate(a.targetDate)!.getTime() - toDate(b.targetDate)!.getTime())
    .slice(0, 3);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Live programme state. Everything below reflects what your team has actually filed${
          user ? `, ${user.name.split(" ")[0]}.` : "."
        }`}
      />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <Tile
          label="Days to M1"
          value={daysToM1 == null ? "—" : daysToM1}
          tone={daysToM1 != null && daysToM1 < 30 ? "red" : "brand"}
          hint={m1 ? fmtDate(m1.targetDate) : undefined}
        />
        <Tile
          label="My open tasks"
          value={myTasks.filter((t) => t.status !== "done").length}
          tone="brand"
          hint={`${myTasks.length} total assigned`}
        />
        <Tile
          label="Blocked"
          value={blockedTasks.length}
          tone={blockedTasks.length > 0 ? "red" : "green"}
        />
        <Tile
          label="For review"
          value={forReview.length}
          tone={forReview.length > 0 ? "amber" : "green"}
        />
        <Tile
          label="Open concerns"
          value={openConcerns.length}
          tone={openConcerns.length > 0 ? "amber" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <section className="card">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-ink">This Monday's minute</h2>
            <Link href="/meetings" className="text-[11px] text-blue-700 hover:underline">
              View all →
            </Link>
          </div>
          <MinuteRow label="This week" iso={monday} minute={currentMinute} />
          <MinuteRow label="Next week" iso={nextMon} minute={nextMinute} />
        </section>

        <section className="card">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-ink">Next 3 milestones</h2>
            <Link href="/milestones" className="text-[11px] text-blue-700 hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {upcoming.map((m) => {
              const ov = milestoneOverrides[m.id];
              const effStatus = ov?.status ?? (m.status as string);
              return (
                <div key={m.id} className="flex items-center justify-between text-[13px]">
                  <div className="min-w-0">
                    <span className="mono text-[11px] text-ink-2 mr-2">{m.id}</span>
                    <span className="font-medium text-ink">{m.name}</span>
                    {ov && (
                      <span className="ml-2 text-[10px] text-amber-700 font-medium">
                        override
                      </span>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="mono text-[11px] text-ink-2">{fmtDate(m.targetDate)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-ink-2">
                      {effStatus.replace("_", " ")}
                    </div>
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <div className="subtle text-sm">No upcoming milestones.</div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-ink">Blocked tasks</h2>
            <Link href="/tasks" className="text-[11px] text-blue-700 hover:underline">
              All tasks →
            </Link>
          </div>
          {blockedTasks.length === 0 ? (
            <div className="card subtle text-sm">Nothing blocked. Good.</div>
          ) : (
            <div className="space-y-2">
              {blockedTasks.slice(0, 5).map((t) => (
                <Link href="/tasks" key={t.id} className="card block !p-3 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13px] text-ink">{t.title}</div>
                    <span
                      className={
                        "text-[10px] mono px-1.5 py-0.5 rounded whitespace-nowrap " +
                        STATUS_COLOR[t.status]
                      }
                    >
                      {STATUS_LABEL[t.status]}
                    </span>
                  </div>
                  <div className="text-[11px] text-ink-2 mt-1">
                    {t.ownerName} · {t.milestone}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-ink">Open concerns</h2>
            <Link href="/concerns" className="text-[11px] text-blue-700 hover:underline">
              All concerns →
            </Link>
          </div>
          {openConcerns.length === 0 ? (
            <div className="card subtle text-sm">No open concerns raised.</div>
          ) : (
            <div className="space-y-2">
              {openConcerns.slice(0, 5).map((c) => (
                <Link href="/concerns" key={c.id} className="card block !p-3 hover:bg-slate-50">
                  <div className="text-[13px] text-ink">{c.statement}</div>
                  <div className="text-[11px] text-ink-2 mt-1">
                    {c.raisedByName} · {c.targetType} ·{" "}
                    <span className="mono">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MinuteRow({
  label,
  iso,
  minute,
}: {
  label: string;
  iso: string;
  minute?: { chair: string; driveLink: string | null; summary: string };
}) {
  const d = new Date(iso + "T11:00:00");
  return (
    <div className="flex items-center justify-between py-2 border-t border-slate-100 first:border-t-0 gap-3">
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-ink-2">{label}</div>
        <div className="text-[13px] text-ink">
          {d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </div>
        {minute?.summary && (
          <div className="text-[11px] text-ink-2 line-clamp-1">{minute.summary}</div>
        )}
      </div>
      <div className="shrink-0 text-right">
        {minute?.driveLink ? (
          <a
            href={minute.driveLink}
            target="_blank"
            rel="noreferrer"
            className="text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
          >
            Open doc ↗
          </a>
        ) : minute ? (
          <span className="text-[11px] text-amber-700">Filed · no link</span>
        ) : (
          <Link
            href="/meetings"
            className="text-[11px] text-blue-700 hover:underline"
          >
            Add link →
          </Link>
        )}
        {minute?.chair && (
          <div className="text-[10px] text-ink-2 mt-1">chair: {minute.chair}</div>
        )}
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string | number;
  tone: "green" | "amber" | "red" | "brand";
  hint?: string;
}) {
  const bar: Record<string, string> = {
    green: "var(--green)",
    amber: "var(--amber)",
    red: "var(--red)",
    brand: "var(--brand)",
  };
  return (
    <div className="card relative overflow-hidden">
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: bar[tone] }} />
      <div className="pl-2">
        <div className="text-[11px] uppercase tracking-wider text-ink-2">{label}</div>
        <div className="text-[26px] font-semibold text-ink leading-tight">{value}</div>
        {hint && <div className="text-[11px] subtle mt-1">{hint}</div>}
      </div>
    </div>
  );
}
