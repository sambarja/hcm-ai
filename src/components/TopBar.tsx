"use client";

import { fmtDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export function TopBar() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "HCM AI · PM";
  const { user, signOut } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white px-6 md:px-8 py-3 flex items-center justify-between">
      <div className="text-[13px] text-ink-2">
        <span className="text-ink font-medium">{appName}</span>
        <span className="mx-2 text-slate-300">·</span>
        <span>Programme dashboard</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-[12px] mono text-ink-2">{fmtDate(new Date())}</div>
        {user && (
          <>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <div className="text-right leading-tight">
                <div className="text-[13px] text-ink font-medium">{user.name}</div>
                <div className="text-[10px] text-ink-2">{user.role}</div>
              </div>
              <span
                className={
                  "text-[10px] mono px-1.5 py-0.5 rounded " +
                  (user.accessLevel === "Admin"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-700")
                }
              >
                {user.accessLevel}
              </span>
              <button
                onClick={signOut}
                className="text-[11px] text-ink-2 hover:text-ink underline underline-offset-2"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
