import { NextResponse } from "next/server";
import { fetchSnapshot } from "@/lib/db/actions";
import { isDbConfigured } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDbConfigured()) {
    return NextResponse.json({ dbConfigured: false, snapshot: null });
  }
  try {
    const snapshot = await fetchSnapshot();
    return NextResponse.json({ dbConfigured: true, snapshot });
  } catch (err) {
    return NextResponse.json(
      { dbConfigured: true, snapshot: null, error: (err as Error).message },
      { status: 500 }
    );
  }
}
