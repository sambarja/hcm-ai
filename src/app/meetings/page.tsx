"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useStore, type MeetingNote } from "@/lib/store";

const NEXT_N_MEETINGS = 8;

function nextMondays(n: number): Date[] {
  const out: Date[] = [];
  const now = new Date();
  const day = now.getDay();
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

  const sortedFiled = useMemo(
    () => meetings.slice().sort((a, b) => b.meetingDate.localeCompare(a.meetingDate)),
    [meetings]
  );

  return (
    <div>
      <PageHeader
        title="Sprint Meetings"
        subtitle="Weekly Monday sprint at 11:00. Minute = one Google Drive link + a one-line summary. Anything longer lives in the Drive doc."
      />

      <div className="mb-8">
        <div className="text-[13px] font-semibold text-ink mb-3">
          Upcoming — next {NEXT_N_MEETINGS} Mondays
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {upcoming.map((d) => {
            const key = isoDate(d);
            const existing = meetingsByDate.get(key);
            const isOpen = openDate === key;
            const prevMeeting = sortedFiled.find((m) => m.meetingDate < key);
            return (
              <div key={key} className="card !p-3">
                <div className="text-[12px] mono text-ink-2">
                  {d.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-[15px] font-semibold text-ink">11:00 sprint</div>
                <div className="text-[11px] text-ink-2 mt-1">
                  {existing ? (
                    <span className="text-green-700">
                      ✓ Filed by {existing.chair}
                      {existing.driveLink ? "" : " · no link"}
                    </span>
                  ) : (
                    <span>No minute yet</span>
                  )}
                </div>
                {existing?.driveLink && (
                  <a
                    href={existing.driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 text-[11px] text-blue-700 hover:underline truncate block"
                  >
                    Open minute doc ↗
                  </a>
                )}
                {existing?.summary && (
                  <div className="mt-1 text-[11px] text-ink-2 line-clamp-2">
                    {existing.summary}
                  </div>
                )}
                <button
                  onClick={() => setOpenDate(isOpen ? null : key)}
                  className="mt-2 text-[11px] text-blue-700 hover:underline"
                >
                  {isOpen ? "Close" : existing ? "Edit minute" : "File minute"}
                </button>
                {isOpen && user && (
                  <MinuteForm
                    existing={existing}
                    prevMeeting={prevMeeting}
                    currentUserName={user.name}
                    onSave={(patch) => {
                      if (existing) updateMeeting(existing.id, patch);
                      else
                        addMeeting({
                          meetingDate: key,
                          chair: patch.chair ?? user.name,
                          driveLink: patch.driveLink ?? null,
                          summary: patch.summary ?? "",
                          attendees: [],
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
            {sortedFiled.map((m) => (
              <div key={m.id} className="card !p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium text-ink">
                      {new Date(m.meetingDate + "T11:00:00").toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-[11px] text-ink-2">
                      Chair: {m.chair}
                      {m.summary ? ` · ${m.summary}` : ""}
                    </div>
                  </div>
                  {m.driveLink ? (
                    <a
                      href={m.driveLink}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-[12px] bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100"
                    >
                      Open Drive doc ↗
                    </a>
                  ) : (
                    <span className="shrink-0 text-[11px] text-amber-700">
                      No Drive link
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MinuteForm({
  existing,
  prevMeeting,
  currentUserName,
  onSave,
  onDelete,
}: {
  existing?: MeetingNote;
  prevMeeting?: MeetingNote;
  currentUserName: string;
  onSave: (patch: Partial<MeetingNote>) => void;
  onDelete?: () => void;
}) {
  const [chair, setChair] = useState(existing?.chair ?? currentUserName);
  const [driveLink, setDriveLink] = useState(existing?.driveLink ?? "");
  const [summary, setSummary] = useState(existing?.summary ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      chair,
      driveLink: driveLink.trim() || null,
      summary: summary.trim(),
    });
  }

  function reuseLastDoc() {
    if (prevMeeting?.driveLink) setDriveLink(prevMeeting.driveLink);
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 text-[12px] border-t border-slate-200 pt-3">
      <div>
        <MLabel>Chair (auto-filled to you)</MLabel>
        <input
          value={chair}
          onChange={(e) => setChair(e.target.value)}
          className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
        />
      </div>
      <div>
        <MLabel>Google Drive link to the minute doc</MLabel>
        <input
          value={driveLink}
          onChange={(e) => setDriveLink(e.target.value)}
          placeholder="https://docs.google.com/document/d/..."
          className="w-full border border-slate-300 rounded px-2 py-1 text-[12px] mono"
          autoFocus
        />
        {prevMeeting?.driveLink && (
          <button
            type="button"
            onClick={reuseLastDoc}
            className="mt-1 text-[10px] text-blue-700 hover:underline"
          >
            ↺ Copy last week's doc link
          </button>
        )}
      </div>
      <div>
        <MLabel>One-line summary (optional)</MLabel>
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="e.g. M1 evidence pack signed; blocked on POC-004 sign-off."
          className="w-full border border-slate-300 rounded px-2 py-1 text-[12px]"
        />
      </div>
      <div className="flex items-center justify-between pt-1">
        <button type="submit" className="text-[12px] bg-ink text-white px-3 py-1 rounded">
          {existing ? "Save" : "File minute"}
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
