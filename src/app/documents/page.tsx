import docsData from "@/data/documents.json";
import type { DocumentEntry } from "@/types";
import { PageHeader } from "@/components/PageHeader";
import { LinkCard } from "@/components/LinkCard";

const SECTIONS: Record<string, string> = {
  A: "A · Team workbooks",
  B: "B · Requirements & source of truth",
  C: "C · Design & wireframes",
  D: "D · Persona models & QA",
  E: "E · Signing, data model, harness, plan",
  F: "F · POCs & ADRs",
  G: "G · OKR source",
};

export default function DocumentsPage() {
  const rows = [...(docsData as DocumentEntry[])].sort((a, b) => {
    const sec = a.section.localeCompare(b.section);
    return sec !== 0 ? sec : a.title.localeCompare(b.title);
  });
  const grouped = new Map<string, DocumentEntry[]>();
  for (const r of rows) {
    if (!grouped.has(r.section)) grouped.set(r.section, []);
    grouped.get(r.section)!.push(r);
  }

  return (
    <div>
      <PageHeader
        title="Documents"
        subtitle="Every artifact from the SAGIP Command Center. File paths open via file:// on the local machine."
      />
      <div className="space-y-8">
        {[...grouped.keys()].sort().map((sec) => (
          <section key={sec}>
            <h2 className="text-[13px] uppercase tracking-wider text-ink-2 mb-3">
              {SECTIONS[sec] ?? sec}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {grouped.get(sec)!.map((d) => (
                <LinkCard
                  key={d.id}
                  title={d.title}
                  purpose={d.purpose}
                  version={d.version}
                  status={d.status}
                  owner={d.ownerName}
                  href={pathToFileHref(d.filePath)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function pathToFileHref(p: string): string {
  if (p.startsWith("file://") || p.startsWith("http")) return p;
  // Windows path — convert to file:/// URL
  return "file:///" + p.replace(/\\/g, "/").replace(/^\//, "");
}
