import Link from "next/link";

const WORK = [
  { href: "/", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/meetings", label: "Sprint Meetings" },
  { href: "/concerns", label: "Concerns" },
];

const REFERENCE = [
  { href: "/milestones", label: "Milestones" },
  { href: "/okrs", label: "OKRs" },
  { href: "/team", label: "Team" },
  { href: "/documents", label: "Documents" },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-slate-200 bg-white hidden md:flex flex-col">
      <div className="px-5 py-5 border-b border-slate-200">
        <div className="text-[15px] font-semibold text-ink leading-tight">HCM AI</div>
        <div className="text-[11px] uppercase tracking-wider text-ink-2 mt-1">Programme PM</div>
      </div>
      <nav className="flex-1 py-3">
        <NavGroup label="Work" items={WORK} />
        <NavGroup label="Reference" items={REFERENCE} />
      </nav>
      <div className="px-5 py-4 border-t border-slate-200 text-[11px] text-ink-2">
        Phase 1 MVP · v0.2
      </div>
    </aside>
  );
}

function NavGroup({ label, items }: { label: string; items: { href: string; label: string }[] }) {
  return (
    <div className="mb-3">
      <div className="px-5 pb-1 pt-2 text-[10px] uppercase tracking-wider text-ink-2">
        {label}
      </div>
      {items.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          className="block px-5 py-2 text-sm text-ink hover:bg-slate-50 hover:text-brand transition-colors"
        >
          {n.label}
        </Link>
      ))}
    </div>
  );
}
