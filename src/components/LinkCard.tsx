import { StatusBadge } from "./StatusBadge";

export function LinkCard({
  title,
  purpose,
  version,
  status,
  href,
  owner,
}: {
  title: string;
  purpose?: string | null;
  version?: string | null;
  status?: string | null;
  href: string;
  owner?: string | null;
}) {
  const tone =
    status === "Current" ? "green" : status === "Superseded" ? "gray" : status === "Reference" ? "purple" : "gold";
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="card block hover:border-brand hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="text-[14px] font-semibold text-ink leading-snug">{title}</div>
        {status && <StatusBadge label={status} tone={tone} />}
      </div>
      {purpose && <div className="text-[12px] subtle leading-snug mb-2">{purpose}</div>}
      <div className="flex items-center justify-between text-[11px] mono text-ink-2">
        <span>{version ?? ""}</span>
        <span>{owner ?? ""}</span>
      </div>
    </a>
  );
}
