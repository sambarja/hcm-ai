import { NextResponse } from "next/server";

/**
 * Phase 1 health check.
 *
 * The site has no database — data is served from static JSON files in
 * src/data/*.json. This endpoint stays for uptime probes and lists the
 * data files loaded at build time.
 */
export function GET() {
  return NextResponse.json({
    ok: true,
    mode: "static-json",
    dataFiles: [
      "milestones",
      "critical-path",
      "objectives",
      "key-results",
      "changes",
      "pocs",
      "adrs",
      "harness-defects",
      "dependencies",
      "risks",
      "team",
      "standups",
      "blockers",
      "agent-runs",
      "jira-tickets",
      "documents",
    ],
  });
}
