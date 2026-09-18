import { fmtDate } from "@/lib/utils";

export function TopBar() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "HCM AI · PM";
  return (
    <header className="border-b border-slate-200 bg-white px-6 md:px-8 py-3 flex items-center justify-between">
      <div className="text-[13px] text-ink-2">
        <span className="text-ink font-medium">{appName}</span>
        <span className="mx-2 text-slate-300">·</span>
        <span>Programme dashboard</span>
      </div>
      <div className="text-[12px] mono text-ink-2">{fmtDate(new Date())}</div>
    </header>
  );
}
