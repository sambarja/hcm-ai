import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const r = await db.execute(sql`SELECT 1 as ok`);
    return NextResponse.json({ ok: true, db: "connected", rows: r.rows?.length ?? 1 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, db: "error", error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
