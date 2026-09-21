"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useStore, type MeetingNote } from "@/lib/store";

const NEXT_N_MEETINGS = 8;

function nextMondays(n: number): Date[] {
  const out: Date[] = [];
  const now = new Date();
  const day = now.getDay(); // 0 Sun ... 1 Mon
  const daysUntilMonday = (1 - day + 7) % 7;
  const first = new Date(now);
  first.setDate(now.getDate() + daysUntilMonday);
  first.setHours(11, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(first);
    d.setDate(first.getDate() + i * 7);
    out.push(d);
  }
  return out;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function MeetingsPage() {
  const { user, isAdmin } = useAuth();
  const { meetings, addMeeting, updateMeeting, deleteMeeting } = useStore();
  const [openDate, setOpenDate] = useState<string | null>(null);

  const upcoming = useMemo(() => nextMondays(NEXT_N_MEETINGS), []);
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, MeetingNote>();
    meetings.forEach((m) => map.set(m.meetingDate, m));
    return map;
  }, [meetings]);

  return (
    <div>
      <PageHeader
        title="Sprint Meetings"
        subtitle="Weekly Monday sprint at 11:00 local. Chair records the minute; decisions and actions feed the accountability platform."
      />

      <div className="mb-8">
        <div className="text-[13px] font-semibold text-ink mb-3">Upcoming — next {NEXT_N_MEETINGS} weeks</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {upcoming.map((d) => {
            const key = isoDate(d);
            const existing = meetingsByDate.get(key);
            const isOpen = openDate === key;
            return (
              <div key={key} className="card !p-3">
                <div className="text-[12px] mono text-ink-2">
                  {d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </div>
                <div className="text-[15px] font-semibold text-ink">11:00 sprint</div>
                <div className="text-[11px] text-ink-2 mt-1">
                  {existing ? (
                    <span className="text-green-700">✓ Minute filed by {existing.chair}</span>
                  ) : (
                    <span>No minute yet</span>
                  )}
                </div>
                <button
                  onClick={() => setOpenDate(isOpen ? null : key)}
                  className="mt-2 text-[11px] text-blue-700 hover:underline"
                >
                  {isOpen ? "Close" : existing ? "View / Edit minute" : "Add minute"}
                </button>
                {isOpen && user && (
                  <MinuteForm
                    date={key}
                    existing={existing}
                    currentUserName={user.name}
                    canDelete={isAdmin}
                    onSave={(patch) => {
                      if (existing) updateMeeting(existing.id, patch);
                      else
                        addMeeting({
                          meetingDate: key,
                          chair: patch.chair ?? user.name,
                          attendees: patch.attendees ?? [],
                          discussion: patch.discussion ?? "",
                          decisions: patch.decisions ?? "",
                          actions: patch.actions ?? "",
                          concerns: patch.concerns ?? "",
                          createdBy: user.name,
                        });
                      setOpenDate(null);
                    }}
                    onDelete={
                      existing && isAdmin
                        ? () => {
                            if (confirm("Delete this minute?")) deleteMeeting(existing.id);
                            setOpenDate(null);
                          }
                        : undefined
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {meetings.length > 0 && (
        <div>
          <div className="text-[13px] font-semibold text-ink mb-3">
            All minutes ({meetings.length})
          </div>
          <div className="space-y-2">
            {meetings
              .slice()
              .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate))
              .map((m) => (
                <details key={m.id} className="card !p-3">
                  <summary className="cursor-pointer">
                    <span className="text-[13px] font-medium text-ink">
                      {new Date(m.meetingDate + "T11:00:00").toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      · 11:00
                    </span>
                    <span className="ml-2 text-[11px] text-ink-2">Chair: {m.chair}</span>
                  </summary>
                  <div className="mt-3 space-y-2 text-[12px]">
                    {m.attendees.length > 0 && (
                      <div>
                        <span className="text-ink-2 uppercase tracking-wider text-[10px]">Attendees: </span>
                        <span className="text-ink">{m.attendees.join(", ")}</span>
                      </div>
                    )}
                    <Section label="Discussion" value={m.discussion} />
                    <Section label="Decisions" value={m.decisions} />
                    <Section label="Actions" value={m.actions} />
                    <Section label="Concerns raised" value={m.concerns} />
                  </div>
                </details>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ label, value }: { label: string; value: string }) {
  if (!value.trim()) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-2">{label}</div>
      <div className="text-ink whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function MinuteForm({
  date,
  existing,
  currentUserName,
  canDelete,
  onSave,
  onDelete,
}: {
  date: string;
  existing?: MeetingNote;
  currentUserName: string;
  canDelete: boolean;
  onSave: (patch: Partial<MeetingNote>) => void;
  onDelete?: () => void;
}) {
  const [chair, setChair] = useState(existing?.chair ?? currentUserName);
  const [attendeesStr, setAttendeesStr] = useState((existing?.attendees ?? []).join(", "));
  const [discussion, setDiscussion] = useState(existing?.discussion ?? "");
  const [decisions, setDecisions] = useState(existing?.decisions ?? "");
  const [actions, setActions] = useState(existing?.actions ?? "");
  const [concerns, setConcerns] = useState(existing?.concerns ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      chair,
      attendees: attendeesStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      discussion,
      decisions,
      actions,
      concerns,
    });
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 text-[12px] border-t border-slate-200 pt-3">
      <div>
        <MLabel>Chair</MLabel>
        <input
          value={chair}
          onChange={(e) => setChair(e.target.value)}
          className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
        />
      </div>
      <div>
        <MLabel>Attendees (comma-separated)</MLabel>
        <input
          value={attendeesStr}
          onChange={(e) => setAttendeesStr(e.target.value)}
          className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
          placeholder="Sam, Sora, Marcus, ..."
        />
      </div>
      <div>
        <MLabel>Discussion</MLabel>
        <textarea
          value={discussion}
          onChange={(e) => setDiscussion(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
          placeholder="One line per topic."
        />
      </div>
      <div>
        <MLabel>Decisions</MLabel>
        <textarea
          value={decisions}
          onChange={(e) => setDecisions(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
          placeholder="One line per decision (DEC-2026-NNN · maker · decision)."
        />
      </div>
      <div>
        <MLabel>Actions</MLabel>
        <textarea
          value={actions}
          onChange={(e) => setActions(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
          placeholder="owner · due · action"
        />
      </div>
      <div>
        <MLabel>Concerns raised</MLabel>
        <textarea
          value={concerns}
          onChange={(e) => setConcerns(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
          placeholder="CN-2026-NNN · raiser · concern · initial response"
        />
      </div>
      <div className="flex items-center justify-between pt-1">
        <button type="submit" className="text-[12px] bg-ink text-white px-3 py-1 rounded">
          {existing ? "Save changes" : "File minute"}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="text-[11px] text-red-700 hover:underline"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

function MLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-ink-2 mb-0.5">{children}</div>
  );
}
