"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";

export function StorageBanner() {
  const { isDbMode, hydrated, hasLocalDataToMigrate, migrateLocalToDb } = useStore();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) return null;

  if (!isDbMode) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[12px] text-amber-900">
        <span className="font-semibold">Local storage mode.</span>{" "}
        Data is per-device only. Provision Vercel Postgres to sync across the team — see{" "}
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-amber-950"
        >
          Vercel dashboard → Storage
        </a>
        .
      </div>
    );
  }

  if (hasLocalDataToMigrate && user) {
    return (
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-[12px] text-blue-900 flex items-center gap-3 flex-wrap">
        <span>
          <span className="font-semibold">Database mode.</span>{" "}
          Local data from before the switch was detected on this device.
        </span>
        <button
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              const r = await migrateLocalToDb({ id: user.id, name: user.name });
              setResult(r);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
          className="bg-blue-700 text-white px-2 py-1 rounded text-[11px] hover:bg-blue-800 disabled:opacity-40"
        >
          {busy ? "Uploading…" : "Upload my local data to the server"}
        </button>
        {result && (
          <span className="text-green-800">
            Done: {result.inserted} inserted, {result.skipped} already on server.
          </span>
        )}
        {error && <span className="text-red-800">Error: {error}</span>}
      </div>
    );
  }

  return null;
}
