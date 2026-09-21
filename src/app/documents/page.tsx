"use client";

import { useMemo, useState } from "react";
import docsData from "@/data/documents.json";
import type { DocumentEntry } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth";
import { useStore, type DocumentExtraLink } from "@/lib/store";
import { toDate } from "@/lib/utils";

const SECTIONS: Record<string, string> = {
  A: "A · Team workbooks",
  B: "B · Requirements & source of truth",
  C: "C · Design & wireframes",
  D: "D · Persona models & QA",
  E: "E · Signing, data model, harness, plan",
  F: "F · POCs & ADRs",
  G: "G · OKR source",
};

const STALE_DAYS = 21;

function isStale(lastTouched: string | null): boolean {
  const t = toDate(lastTouched);
  if (!t) return false;
  return (Date.now() - t.getTime()) / (1000 * 60 * 60 * 24) > STALE_DAYS;
}

function pathToFileHref(p: string): string {
  if (p.startsWith("file://") || p.startsWith("http")) return p;
  return "file:///" + p.replace(/\\/g, "/").replace(/^\//, "");
}

export default function DocumentsPage() {
  const { user, isAdmin } = useAuth();
  const { documentOverrides, setDocumentOverride, clearDocumentOverride, addConcern, concerns } =
    useStore();
  const [filter, setFilter] = useState<"all" | "stale" | "with_concerns">("all");

  const rows = useMemo(
    () =>
      [...(docsData as DocumentEntry[])].sort((a, b) => {
        const sec = a.section.localeCompare(b.section);
        return sec !== 0 ? sec : a.title.localeCompare(b.title);
      }),
    []
  );

  const concernCountByDoc = useMemo(() => {
    const m = new Map<string, number>();
    concerns.forEach((c) => {
      if (c.targetType === "document" && c.targetId) {
        m.set(c.targetId, (m.get(c.targetId) ?? 0) + 1);
      }
    });
    return m;
  }, [concerns]);

  const visible = useMemo(() => {
    if (filter === "stale") return rows.filter((r) => isStale(r.lastTouched));
    if (filter === "with_concerns") return rows.filter((r) => (concernCountByDoc.get(r.id) ?? 0) > 0);
    return rows;
  }, [rows, filter, concernCountByDoc]);

  const grouped = new Map<string, DocumentEntry[]>();
  for (const r of visible) {
    if (!grouped.has(r.section)) grouped.set(r.section, []);
    grouped.get(r.section)!.push(r);
  }

  const staleCount = rows.filter((r) => isStale(r.lastTouched)).length;
  const withConcerns = rows.filter((r) => (concernCountByDoc.get(r.id) ?? 0) > 0).length;

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Every artifact from the HCM AI Command Center. Admins can add Drive links, descriptions, and raise concerns directly on a doc."
        right={
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="text-[12px] border border-slate-300 rounded px-2 py-1"
            >
              <option value="all">All ({rows.length})</option>
              <option value="stale">Stale ({staleCount})</option>
              <option value="with_concerns">With concerns ({withConcerns})</option>
            </select>
          </div>
        }
      />
      <div className="space-y-8">
        {[...grouped.keys()].sort().map((sec) => (
          <section key={sec}>
            <h2 className="text-[13px] uppercase tracking-wider text-ink-2 mb-3">
              {SECTIONS[sec] ?? sec}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped.get(sec)!.map((d) => (
                <DocCard
                  key={d.id}
                  doc={d}
                  override={documentOverrides[d.id]}
                  concernCount={concernCountByDoc.get(d.id) ?? 0}
                  isAdmin={isAdmin}
                  currentUserName={user?.name ?? ""}
                  currentUserId={user?.id ?? ""}
                  onSaveOverride={(patch) => {
                    if (!user) return;
                    setDocumentOverride(d.id, {
                      description: patch.description,
                      extraLinks: patch.extraLinks,
                      updatedBy: user.name,
                    });
                  }}
                  onClearOverride={() => clearDocumentOverride(d.id)}
                  onRaiseConcern={(statement, impact, evidenceLink) => {
                    if (!user) return;
                    addConcern({
                      statement,
                      raisedById: user.id,
                      raisedByName: user.name,
                      targetType: "document",
                      targetId: d.id,
                      impact,
                      evidenceLink,
                    });
                  }}
                />
              ))}
            </div>
          </section>
        ))}
        {visible.length === 0 && (
          <div className="text-center text-ink-2 text-[13px] py-12 border border-dashed border-slate-300 rounded">
            No documents match the filter.
          </div>
        )}
      </div>
    </div>
  );
}

function DocCard({
  doc,
  override,
  concernCount,
  isAdmin,
  currentUserName,
  onSaveOverride,
  onClearOverride,
  onRaiseConcern,
}: {
  doc: DocumentEntry;
  override?: { description: string; extraLinks: DocumentExtraLink[]; updatedBy: string; updatedAt: string };
  concernCount: number;
  isAdmin: boolean;
  currentUserName: string;
  currentUserId: string;
  onSaveOverride: (patch: { description: string; extraLinks: DocumentExtraLink[] }) => void;
  onClearOverride: () => void;
  onRaiseConcern: (statement: string, impact: string, evidenceLink: string | null) => void;
}) {
  const [tab, setTab] = useState<"view" | "edit" | "concern">("view");
  const stale = isStale(doc.lastTouched);

  return (
    <div className="card !p-3 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-ink leading-tight">{doc.title}</div>
          <div className="text-[10px] text-ink-2 mt-0.5">
            {doc.version && <span className="mono">{doc.version} · </span>}
            {doc.ownerName ?? "—"}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {stale && (
            <span className="text-[9px] mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
              STALE
            </span>
          )}
          {concernCount > 0 && (
            <span className="text-[9px] mono bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
              {concernCount} concern{concernCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {doc.purpose && <div className="text-[11px] text-ink-2 line-clamp-2">{doc.purpose}</div>}

      {override?.description && (
        <div className="text-[11px] text-ink bg-slate-50 rounded p-1.5">
          {override.description}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        <a
          href={pathToFileHref(doc.filePath)}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] bg-slate-100 text-ink px-2 py-0.5 rounded hover:bg-slate-200"
        >
          Open source ↗
        </a>
        {(override?.extraLinks ?? []).map((l) => (
          <a
            key={l.id}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-100"
          >
            {l.label} ↗
          </a>
        ))}
      </div>

      {override && (
        <div className="text-[10px] text-ink-2">
          Managed by {override.updatedBy} · {new Date(override.updatedAt).toLocaleDateString()}
        </div>
      )}

      <div className="border-t border-slate-100 pt-2 mt-auto flex items-center gap-3">
        {isAdmin && (
          <>
            <button
              onClick={() => setTab(tab === "edit" ? "view" : "edit")}
              className="text-[11px] text-blue-700 hover:underline"
            >
              {tab === "edit" ? "Cancel edit" : "Manage links / description"}
            </button>
            <span className="text-ink-2 text-[10px]">·</span>
          </>
        )}
        <button
          onClick={() => setTab(tab === "concern" ? "view" : "concern")}
          className="text-[11px] text-amber-700 hover:underline"
        >
          {tab === "concern" ? "Cancel" : "Raise concern"}
        </button>
      </div>

      {tab === "edit" && isAdmin && (
        <EditForm
          override={override}
          currentUserName={currentUserName}
          onSave={(patch) => {
            onSaveOverride(patch);
            setTab("view");
          }}
          onRevert={() => {
            if (confirm("Remove all extra links and description for this document?")) {
              onClearOverride();
              setTab("view");
            }
          }}
        />
      )}
      {tab === "concern" && (
        <ConcernForm
          docTitle={doc.title}
          currentUserName={currentUserName}
          onSubmit={(statement, impact, link) => {
            onRaiseConcern(statement, impact, link);
            setTab("view");
          }}
        />
      )}
    </div>
  );
}

function EditForm({
  override,
  onSave,
  onRevert,
}: {
  override?: { description: string; extraLinks: DocumentExtraLink[] };
  currentUserName: string;
  onSave: (patch: { description: string; extraLinks: DocumentExtraLink[] }) => void;
  onRevert: () => void;
}) {
  const [description, setDescription] = useState(override?.description ?? "");
  const [links, setLinks] = useState<DocumentExtraLink[]>(override?.extraLinks ?? []);
  const [newLabel, setNewLabel] = useState("");
  const [newUrl, setNewUrl] = useState("");

  function addLink() {
    if (!newLabel.trim() || !newUrl.trim()) return;
    setLinks((ls) => [
      ...ls,
      { id: `L-${Date.now().toString(36)}`, label: newLabel.trim(), url: newUrl.trim() },
    ]);
    setNewLabel("");
    setNewUrl("");
  }

  function removeLink(id: string) {
    setLinks((ls) => ls.filter((l) => l.id !== id));
  }

  return (
    <div className="border-t border-slate-200 pt-2 mt-1 space-y-2 text-[11px]">
      <div>
        <FLabel>Description / status note</FLabel>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 rounded px-2 py-1 text-[11px]"
          placeholder="e.g. Draft under review by Sora — expect v1.1 by Monday."
        />
      </div>
      <div>
        <FLabel>Extra links</FLabel>
        <div className="space-y-1 mb-1">
          {links.map((l) => (
            <div key={l.id} className="flex items-center gap-1 text-[11px]">
              <span className="font-medium text-ink shrink-0">{l.label}</span>
              <span className="text-ink-2 truncate flex-1 mono">{l.url}</span>
              <button
                onClick={() => removeLink(l.id)}
                className="text-red-700 hover:underline text-[10px]"
              >
                remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Label (e.g. Drive)"
            className="w-24 border border-slate-300 rounded px-1.5 py-1 text-[11px]"
          />
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://..."
            className="flex-1 border border-slate-300 rounded px-1.5 py-1 text-[11px] mono"
          />
          <button
            type="button"
            onClick={addLink}
            className="text-[11px] bg-slate-200 px-2 rounded hover:bg-slate-300"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSave({ description: description.trim(), extraLinks: links })}
          className="text-[11px] bg-ink text-white px-3 py-1 rounded"
        >
          Save
        </button>
        {override && (
          <button
            onClick={onRevert}
            className="text-[11px] text-red-700 hover:underline ml-auto"
          >
            Remove all
          </button>
        )}
      </div>
    </div>
  );
}

function ConcernForm({
  docTitle,
  currentUserName,
  onSubmit,
}: {
  docTitle: string;
  currentUserName: string;
  onSubmit: (statement: string, impact: string, evidenceLink: string | null) => void;
}) {
  const [statement, setStatement] = useState("");
  const [impact, setImpact] = useState("");
  const [link, setLink] = useState("");

  return (
    <div className="border-t border-slate-200 pt-2 mt-1 space-y-2 text-[11px]">
      <div>
        <FLabel>Concern about "{docTitle}"</FLabel>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={2}
          className="w-full border border-slate-300 rounded px-2 py-1 text-[11px]"
          placeholder="e.g. Version 1.0 contradicts ADR-002."
          autoFocus
        />
      </div>
      <div>
        <FLabel>Impact</FLabel>
        <input
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          className="w-full border border-slate-300 rounded px-2 py-1 text-[11px]"
          placeholder="e.g. Blocks M2 sign-off."
        />
      </div>
      <div>
        <FLabel>Evidence link (optional)</FLabel>
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://drive.google.com/..."
          className="w-full border border-slate-300 rounded px-2 py-1 text-[11px] mono"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (statement.trim()) onSubmit(statement.trim(), impact.trim(), link.trim() || null);
          }}
          disabled={!statement.trim()}
          className="text-[11px] bg-ink text-white px-3 py-1 rounded disabled:opacity-40"
        >
          Raise
        </button>
        <span className="text-[10px] text-ink-2 ml-auto">as {currentUserName}</span>
      </div>
    </div>
  );
}

function FLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-ink-2 mb-0.5">{children}</div>
  );
}
