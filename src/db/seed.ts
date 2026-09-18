/**
 * Seed script for HCM AI PM. Populates the DB from the current SAGIP workbooks.
 * Idempotent — uses onConflictDoNothing() on every insert.
 *
 * Run:  npm run db:seed
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import {
  milestones,
  criticalPathTasks,
  objectives,
  keyResults,
  changes,
  pocs,
  adrs,
  harnessDefects,
  dependencies,
  risks,
  teamMembers,
  standupEntries,
  blockers,
  agentRuns,
  jiraTickets,
  documents,
} from "./schema";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required. Copy .env.example to .env first.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

// A conservative NTP anchor to render Gantt bars.
// Change this to real NTP once issued; the schema stores absolute dates thereafter.
const NTP = new Date("2027-01-15");
const wk = (n: number) => new Date(NTP.getTime() + n * 7 * 24 * 60 * 60 * 1000);

async function main() {
  console.log("Seeding HCM AI PM database...");

  // ---------- Milestones ----------
  await db.insert(milestones).values([
    {
      id: "M0",
      name: "Pre-engagement freeze",
      weeksFromNtp: "-4 to 0",
      targetDate: NTP,
      deliverable: "Documentation and rules pack frozen for build.",
      acceptanceOracle: "Pre-M1 OKRs closed; documentation set frozen.",
      exitCondition: "All Pre-M1 KRs graded; documentation index at HRIS/POC/SAGIP_Command_Center.xlsx marked Current.",
      internalPredecessor: "Pre-M1 OKRs closed.",
      status: "in_progress",
      rag: "amber",
    },
    {
      id: "M1",
      name: "Rules pack and payroll core",
      weeksFromNtp: "0 to 6",
      targetDate: wk(6),
      deliverable: "Payroll computation walkthrough on a seeded LGU dataset.",
      acceptanceOracle: "Rules pack and reference payroll register (References/PAYROLL-SYSTEM.xlsm).",
      exitCondition: "L1 harness green on frozen rules pack; walkthrough recorded to evidence folder.",
      internalPredecessor: "POCs on rules pack and semi-monthly split closed by ADR.",
      status: "not_started",
      rag: "gray",
    },
    {
      id: "M2",
      name: "Workflow engine and manage-by-exception",
      weeksFromNtp: "6 to 12",
      targetDate: wk(12),
      deliverable: "Signature routing demonstration for job order payroll and one exception path.",
      acceptanceOracle: "LGU HR workflow swimlanes.",
      exitCondition: "L3 harness green; manage-by-exception demonstration recorded.",
      internalPredecessor: "M1 accepted internally; workflow swimlanes reviewed.",
      status: "not_started",
      rag: "gray",
    },
    {
      id: "M3",
      name: "Signing services and PNPKI integration",
      weeksFromNtp: "12 to 16",
      targetDate: wk(16),
      deliverable: "End-to-end signed payroll for a sample cut-off, with fallback path shown.",
      acceptanceOracle: "ADR-005 and the signing series handover.",
      exitCondition: "L2 contract tests green against PNPKI stub; L4 green end-to-end on seeded env.",
      internalPredecessor: "PNPKI nomination completed; ADR-005 closed.",
      status: "not_started",
      rag: "gray",
    },
    {
      id: "M4",
      name: "Mobile field capture, offline-first",
      weeksFromNtp: "12 to 20",
      targetDate: wk(20),
      deliverable: "Field capture on Android and iOS, incl. offline queue and sync.",
      acceptanceOracle: "Mobile architecture blueprint and mobile data model.",
      exitCondition: "L4 green including a forced-offline scenario; UI evidence on both platforms.",
      internalPredecessor: "Mobile data model accepted; L4 integration harness green on seeded environment.",
      status: "not_started",
      rag: "gray",
    },
    {
      id: "M5",
      name: "Consolidation and acceptance build",
      weeksFromNtp: "20 to 24",
      targetDate: wk(24),
      deliverable: "Full build offered for acceptance rehearsal, then for acceptance.",
      acceptanceOracle: "TOR numbered specifications.",
      exitCondition: "L6 acceptance rehearsal green against the offered build.",
      internalPredecessor: "L6 acceptance rehearsal green against the offered build.",
      status: "not_started",
      rag: "gray",
    },
    {
      id: "MR",
      name: "Acceptance rehearsal (on demand)",
      weeksFromNtp: "on demand before M3, M4, M5",
      targetDate: wk(22),
      deliverable: "Internal rehearsal against the build that will be offered.",
      acceptanceOracle: "L1 to L5 green on the target build.",
      exitCondition: "Rehearsal report signed; gaps closed before offer.",
      internalPredecessor: "L1 to L5 green on the target build.",
      status: "not_started",
      rag: "gray",
    },
  ]).onConflictDoNothing();

  // ---------- Critical path tasks (§5.1) + slack (§5.2) ----------
  const cpt = await db
    .insert(criticalPathTasks)
    .values([
      // Critical path
      {
        orderIx: 1,
        task: "Rules pack freeze for the current cut-off",
        reason: "Every downstream test and every UI screen depends on the frozen pack.",
        owner: "Quality and harness engineer",
        revealsSlipIn: "L1 harness",
        onCriticalPath: true,
        plannedStart: NTP,
        plannedFinish: wk(3),
        status: "in_progress",
        milestoneId: "M1",
      },
      {
        orderIx: 2,
        task: "Payroll computation build (regular, casual, JO)",
        reason: "Three staff types are all required for M1; a missing type blocks the milestone.",
        owner: "Engineering owner",
        revealsSlipIn: "M1 walkthrough",
        onCriticalPath: true,
        plannedStart: wk(2),
        plannedFinish: wk(6),
        status: "not_started",
        milestoneId: "M1",
      },
      {
        orderIx: 3,
        task: "Workflow engine with exception routing",
        reason: "Manage-by-exception is the differentiator; without it the signing path collapses to manual.",
        owner: "Engineering owner",
        revealsSlipIn: "L3 harness",
        onCriticalPath: true,
        plannedStart: wk(6),
        plannedFinish: wk(12),
        status: "not_started",
        milestoneId: "M2",
      },
      {
        orderIx: 4,
        task: "PNPKI enrolment and signing integration",
        reason: "External dependency with the longest and least controllable lead time on the programme.",
        owner: "Project owner (dep) / Engineering owner (integration)",
        revealsSlipIn: "M3 walkthrough",
        onCriticalPath: true,
        plannedStart: NTP,
        plannedFinish: wk(16),
        status: "not_started",
        milestoneId: "M3",
      },
      {
        orderIx: 5,
        task: "Signed payroll end-to-end",
        reason: "Combines rules pack, workflow, signing into the artifact the client consumes.",
        owner: "Engineering owner",
        revealsSlipIn: "L4 harness and M3 offer",
        onCriticalPath: true,
        plannedStart: wk(12),
        plannedFinish: wk(16),
        status: "not_started",
        milestoneId: "M3",
      },
      {
        orderIx: 6,
        task: "Acceptance rehearsal on the offered build",
        reason: "The last gate before the client. A rehearsal on the wrong build teaches nothing.",
        owner: "Project owner",
        revealsSlipIn: "L6 harness",
        onCriticalPath: true,
        plannedStart: wk(22),
        plannedFinish: wk(24),
        status: "not_started",
        milestoneId: "M5",
      },
      // Non-critical with slack
      {
        orderIx: 101,
        task: "Mobile field capture polish",
        reason: "Non-critical polish; can absorb small slips without moving M4.",
        owner: "Engineering owner",
        revealsSlipIn: "L4 harness",
        onCriticalPath: false,
        slackDays: 10,
        entersCriticalPathIf: "Offline sync defect is Major or Critical after M4.",
        plannedStart: wk(14),
        plannedFinish: wk(20),
        status: "not_started",
        milestoneId: "M4",
      },
      {
        orderIx: 102,
        task: "Reporting screens beyond payroll",
        reason: "TOR-required but not on the payroll-signing critical chain.",
        owner: "Engineering owner",
        revealsSlipIn: "M5 rehearsal",
        onCriticalPath: false,
        slackDays: 15,
        entersCriticalPathIf: "A required TOR report is missing at M5.",
        plannedStart: wk(16),
        plannedFinish: wk(22),
        status: "not_started",
        milestoneId: "M5",
      },
      {
        orderIx: 103,
        task: "Auxiliary integrations (GSIS, statutory endpoints beyond signing)",
        reason: "Statutory rendering; counterparts are less time-sensitive than PNPKI.",
        owner: "Engineering owner",
        revealsSlipIn: "L2 contract tests",
        onCriticalPath: false,
        slackDays: 10,
        entersCriticalPathIf: "A counterpart schema changes and blocks L2.",
        plannedStart: wk(6),
        plannedFinish: wk(20),
        status: "not_started",
        milestoneId: "M4",
      },
      {
        orderIx: 104,
        task: "Persona-model UI refinements",
        reason: "Post-M2 UI-polish; wireframe change would move it onto the path.",
        owner: "Design lead",
        revealsSlipIn: "Sprint review",
        onCriticalPath: false,
        slackDays: 8,
        entersCriticalPathIf: "A wireframe change lands after M2.",
        plannedStart: wk(12),
        plannedFinish: wk(18),
        status: "not_started",
        milestoneId: "M2",
      },
    ])
    .onConflictDoNothing()
    .returning();

  // ---------- Objectives + KRs ----------
  await db.insert(objectives).values([
    {
      id: 1,
      title: "Define the product through diagrams and rules an AI agent can build from — not a spec doc no one will read.",
      description: "Transitory: swimlane diagrams + eng collaboration on system design.",
      quarter: "Pre-M1 (Q3 2026)",
    },
    {
      id: 2,
      title: "Make the UI the real test — prototype it in Claude Design, don't just describe it.",
      description: "Transitory: UI/UX prototype in Claude Design, consumer-style experience.",
      quarter: "Pre-M1 (Q3 2026)",
    },
    {
      id: 3,
      title: "Build faster and leaner — automate and streamline the flow.",
      description: "Margins here aren't what big companies have — speed is the edge.",
      quarter: "Pre-M1 (Q3 2026)",
    },
    {
      id: 4,
      title: "Track progress and risk the AI-native way — critical chain, not status reports.",
      description: "Transitory: manage deliverables/tasks/schedule + usability-aligned checks.",
      quarter: "Pre-M1 (Q3 2026)",
    },
    {
      id: 5,
      title: "Replace meetings with documentation — align by writing and reading, not by scheduling calls.",
      description: "Meetings only for hard alignment; docs replace the rest.",
      quarter: "Pre-M1 (Q3 2026)",
    },
  ]).onConflictDoNothing();

  await db.insert(keyResults).values([
    // Objective 1
    { id: "KR 1.1", objectiveId: 1, krNumber: "1.1", type: "committed", owner: "Sam", reference: "Transitory: swimlane diagrams + eng collaboration",
      description: "Draft a workflow swimlane diagram for every core process (leave filing, payroll run, JO/COS renewal, travel/field capture, etc.) showing usability, pain points, and the actual benefit to the end user — then work those diagrams directly with Engineering on system design, instead of writing a formal requirements document.",
      target: "1 swimlane diagram per core process, each reviewed with Engineering before build starts",
      grade: 0.7 },
    { id: "KR 1.2", objectiveId: 1, krNumber: "1.2", type: "committed", owner: "Sam", reference: "Transitory: prioritisation stays as-is",
      description: "Sequence the backlog by what people will actually see and touch first — forms, dashboards, the mobile capture app — even if some backend-only pieces aren't done yet.",
      target: "Top 3 client-visible modules are demo-ready before backend-only modules", grade: 0.6 },
    { id: "KR 1.3", objectiveId: 1, krNumber: "1.3", type: "committed", owner: "Sam", reference: "Transitory: end-user scope creep framing",
      description: "Hold every proposed feature against the TOR's scope, specifically watching for scope creep once there's an actual end user reacting to what they see — reject or defer anything that isn't in scope or wouldn't actually be seen/felt by them.",
      target: "0 out-of-scope or invisible-to-user features accepted into the backlog", grade: 0.8 },
    { id: "KR 1.4", objectiveId: 1, krNumber: "1.4", type: "committed", owner: "Sam", reference: "Transitory: agentic coding-compatible business-rule docs",
      description: "Document every statutory or business rule the system runs on — leave computation, payroll deductions, GSIS/PhilHealth/BIR formulas — with its proper legal citation, structured so it can be fed straight to our AI coding agents.",
      target: "100% of statutory/business rules documented with citation, in agent-readable format", grade: 0.5 },
    // Objective 2
    { id: "KR 2.1", objectiveId: 2, krNumber: "2.1", type: "committed", owner: "Marcus + Franc", reference: "Transitory: UI/UX prototype in Claude Design",
      description: "Build the actual UI/UX prototype in Claude Design for every core workflow, translating the requirements straight into a consumer-style interface — not a government-form-style one — so the acceptance bar for a feature is the prototype itself.",
      target: "100% of core workflows have a Claude Design prototype before backend work starts; 0 client-facing acceptance-criteria documents produced",
      grade: 0.65 },
    { id: "KR 2.2", objectiveId: 2, krNumber: "2.2", type: "committed", owner: "Sam", reference: "Transitory: team review of prototypes",
      description: "Walk every prototype and demo through with the full internal team before it's marked ready — not just a solo review — so usability gaps get caught by more than one set of eyes.",
      target: "100% of prototypes walked through with the team before being marked ready", grade: 0.7 },
    { id: "KR 2.3", objectiveId: 2, krNumber: "2.3", type: "committed", owner: "QA / Harness Engineer", reference: "Transitory: Shift-Left Scenario UAT",
      description: "Bring testing forward: define the key UAT scenarios up front and personally represent the end-user perspective in Shift-Left UAT sessions.",
      target: "100% of modules go through a Shift-Left UAT pass, representing the user perspective, before sign-off", grade: 0.4 },
    { id: "KR 2.4", objectiveId: 2, krNumber: "2.4", type: "committed", owner: "QA / Harness Engineer", reference: "Issue classification unchanged from Ideal",
      description: "Review every logged issue and confirm it's tagged by real user-visible impact, not just an internal severity label.",
      target: "100% of logged issues reviewed and tagged by user-visible impact", grade: 0.5 },
    // Objective 3
    { id: "KR 3.1", objectiveId: 3, krNumber: "3.1", type: "committed", owner: "Sam", reference: "Speed is the edge",
      description: "Walk the current dev process end to end and flag the 3 slowest, most manual steps in it.",
      target: "3 biggest time-sinks identified and written down", grade: 0.8 },
    { id: "KR 3.2", objectiveId: 3, krNumber: "3.2", type: "aspirational", owner: "Engineering Owner", reference: "Assigned to me to plan",
      description: "Work with the Engineering Owner to make AI-assisted coding the default way features get built, not an occasional shortcut.",
      target: "≥ 70% of new feature branches built with AI-assisted tooling", grade: 0.55 },
    { id: "KR 3.3", objectiveId: 3, krNumber: "3.3", type: "committed", owner: "Sam", reference: "Streamlining = my responsibility this phase",
      description: "Find and automate at least 3 manual, repetitive steps in the build-test-ship loop (test data setup, deployment steps, etc.).",
      target: "≥ 3 manual steps automated out of the pipeline", grade: 0.6 },
    { id: "KR 3.4", objectiveId: 3, krNumber: "3.4", type: "aspirational", owner: "Sam", reference: "How we compete without enterprise-size margins",
      description: "Track how long it takes from a feature entering the backlog to being demo-ready, and bring that number down over the quarter.",
      target: "Feature cycle time down ≥ 25% quarter over quarter", grade: 0.3 },
    // Objective 4
    { id: "KR 4.1", objectiveId: 4, krNumber: "4.1", type: "committed", owner: "Sam", reference: "Transitory: manage deliverables/tasks/schedule + usability-aligned checks",
      description: "Keep one running view of team deliverables, tasks, and the release schedule — and check progress not just against the plan, but against whether the output still holds up from the end user's usability perspective.",
      target: "Deliverables/tasks/schedule tracked in one live place; usability re-checked at every progress review", grade: 0.7 },
    { id: "KR 4.2", objectiveId: 4, krNumber: "4.2", type: "aspirational", owner: "Sam", reference: "Transitory: AI-first task tracker design",
      description: "Design an AI-first task tracker — not just adopt one — that keeps the project outline, tasks, and release schedule updating themselves as work moves.",
      target: "1 AI-first task tracker designed and in active use; project outline updates itself as tasks move, 0 status meetings needed", grade: 0.5 },
    { id: "KR 4.3", objectiveId: 4, krNumber: "4.3", type: "committed", owner: "Sam", reference: "Transitory: risk/dependency list, critical chain, blocker governance",
      description: "Draft the initial risk and dependency list, identify and actively track the 'critical chain' toward completion, and design the actual process for how blockers and unresolved decisions get resolved.",
      target: "1 live risk/dependency list; critical chain identified and reviewed weekly; 1 documented blocker-resolution process in use", grade: 0.65 },
    { id: "KR 4.4", objectiveId: 4, krNumber: "4.4", type: "committed", owner: "Sam", reference: "Transitory: escalate aging issues aligned with the critical chain",
      description: "Escalate issues specifically when they're aging (open too long) or sitting on the critical chain — not every open issue, just the ones actually threatening the timeline.",
      target: "100% of aging or critical-chain-blocking issues escalated within 2 working days of being flagged", grade: 0.7 },
    // Objective 5
    { id: "KR 5.1", objectiveId: 5, krNumber: "5.1", type: "committed", owner: "Sam", reference: "Transitory: goal-alignment pass + AI-first minutes",
      description: "Run a clarifying pass with every team member so everyone's aligned on the same goals, outcomes, and success criteria up front, and make sure every meeting that still happens after that produces AI-first minutes.",
      target: "100% of team members aligned on one shared goals doc at kickoff; 100% of meetings produce AI-first minutes within 1 day", grade: 0.55 },
    { id: "KR 5.2", objectiveId: 5, krNumber: "5.2", type: "committed", owner: "Sam", reference: "No SLA, no routine meetings",
      description: "Cut recurring meetings entirely — no daily standups, no weekly status calls, no fixed response-time commitments. Live discussion is capped at one ad-hoc sync a week.",
      target: "0 recurring meetings on the calendar; ≤ 1 ad-hoc hard-alignment sync per week", grade: 0.9 },
    { id: "KR 5.3", objectiveId: 5, krNumber: "5.3", type: "aspirational", owner: "Sam", reference: "Good documentation replaces lengthy meetings",
      description: "Keep documentation good enough that it actually replaces a meeting, not just exists next to one.",
      target: "≥ 90% of alignment questions raised in a given week get answered from existing docs alone, 0 meeting needed", grade: 0.6 },
    { id: "KR 5.4", objectiveId: 5, krNumber: "5.4", type: "committed", owner: "Sam", reference: "Transitory: end-user documents current",
      description: "Keep the actual end-user-facing documents — milestones, turnover materials, stakeholder-alignment notes, key procedures — current and complete.",
      target: "All 4 named end-user document types kept current, checked at every review", grade: 0.75 },
    { id: "KR 5.5", objectiveId: 5, krNumber: "5.5", type: "aspirational", owner: "Sam", reference: "Shared source of truth in sync with AI agents",
      description: "Keep the shared documentation (goals doc, business-rule docs, decision log, risk list, project outline) current and consistently structured enough that it can be fed straight into an AI agent for a quick, accurate answer.",
      target: "100% of shared docs stay current enough to answer an alignment question via AI, no live explanation needed", grade: 0.5 },
  ]).onConflictDoNothing();

  // ---------- Team ----------
  await db.insert(teamMembers).values([
    { name: "Sam", role: "Project Owner (+ Full-Stack, Scrum)", primaryWorkbook: "Team Master + all others",
      krsOwned: "O1–O5 (all 21 KRs)", reportsTo: "Leadership", contact: "dev2@supervaise.io", timezone: "PH",
      notes: "Owns this dashboard and the seven agents." },
    { name: "(TBD) Engineering Owner", role: "Engineering Owner", primaryWorkbook: "Engineering Sprint Tracker",
      krsOwned: "KR 3.2, 3.3, 3.4 primary", reportsTo: "Leadership", contact: "—", timezone: "PH",
      notes: "Sprint velocity + AI-coding adoption." },
    { name: "(TBD) QA Lead", role: "QA / Harness Engineer", primaryWorkbook: "QA Testing Tracker",
      krsOwned: "KR 2.3, 2.4 primary", reportsTo: "Sam", contact: "—", timezone: "PH",
      notes: "UAT scenarios + user-visible impact tagging." },
    { name: "Marcus", role: "Web Persona Lead / Design", primaryWorkbook: "Design Prototype Tracker",
      krsOwned: "KR 1.1, 2.1 (Web)", reportsTo: "Sam", contact: "—", timezone: "PH",
      notes: "WP-01 through WP-12 personas." },
    { name: "Franc", role: "Mobile Persona Lead / Design", primaryWorkbook: "Design Prototype Tracker",
      krsOwned: "KR 1.1, 2.1 (Mobile)", reportsTo: "Sam", contact: "—", timezone: "PH",
      notes: "MP-01 through MP-11 personas." },
  ]).onConflictDoNothing();

  // ---------- Risks (Work Plan §9.1, 10 failure modes) ----------
  await db.insert(risks).values([
    { mode: "Counterpart delay",
      earlySign: "PNPKI, GSIS, or a statutory endpoint does not respond within its stated lead time.",
      mitigation: "Contract layer stubs the counterpart from day one; L2 harness catches drift when the real counterpart returns.",
      escalation: "Named on the dependency list in the monthly report (TOR 7.3); milestone date not moved unless delay exceeds §5.2 slack.",
      realised: false, severity: "Major", milestoneId: "M3" },
    { mode: "Rule misinterpretation",
      earlySign: "L1 harness disagrees with the reference payroll register on any staff type.",
      mitigation: "Rules pack versioned per ADR-001 and ADR-003; every L1 test declares pack version and evidence records its hash.",
      escalation: "New ADR to correct the rule; M1 gate does not close until L1 is green on the corrected pack.",
      realised: false, severity: "Major", milestoneId: "M1" },
    { mode: "Silent scope creep from exceptions",
      earlySign: "The exception path routes cases that should have been auto-approved.",
      mitigation: "Manage-by-exception proved at L3 with an auto-approved fixture and an exception fixture for every rule.",
      escalation: "Rule owner reviews the routing; a rule with more than one exception fixture reopens the specification.",
      realised: false, severity: "Major", milestoneId: "M2" },
    { mode: "Agent hallucination",
      earlySign: "The diff contains code that has no basis in the prompt or the specification.",
      mitigation: "Prompts and specifications stored with the change; reviewer reads the prompt before the diff.",
      escalation: "Change is withdrawn and re-run with a corrected prompt; failure logged as HRN if the harness did not catch it.",
      realised: false, severity: "Minor" },
    { mode: "Offline sync divergence",
      earlySign: "Mobile client and server disagree on the state of a submitted capture after a forced reconnect.",
      mitigation: "L4 harness includes a forced-offline scenario; mobile data model reviewed before M4.",
      escalation: "M4 not closed until divergence is reproduced, fixed, and L4 fixture updated to prevent regression.",
      realised: false, severity: "Major", milestoneId: "M4" },
    { mode: "Signing key custody breach or loss",
      earlySign: "A signing key is used from a device not on the approved list, or a key holder is unreachable.",
      mitigation: "Custody governed by ADR-005; fallback to manual signature kept ready for M3.",
      escalation: "Immediate Critical gap; milestone paused and Project Owner escalates to LGU counterpart.",
      realised: false, severity: "Critical", milestoneId: "M3" },
    { mode: "Undocumented decision",
      earlySign: "A change is merged that references a rule or interface no artifact describes.",
      mitigation: "Every change carries a specification note; reviewer blocks a merge that cannot cite its source.",
      escalation: "Change reverted; the underlying decision captured as an ADR before the change is re-attempted.",
      realised: false, severity: "Major" },
    { mode: "Meeting sprawl",
      earlySign: "More than the ceremonies in Work Plan §7.1 are convened in a week.",
      mitigation: "Meetings held only when documentation cannot answer the question; written stand-up carries daily traffic.",
      escalation: "Project Owner cancels the excess; questions the meetings were called for are written back into the relevant document.",
      realised: false, severity: "Minor" },
    { mode: "Critical-path task starting late",
      earlySign: "A task on the path in Work Plan §5.1 has not started by its planned start.",
      mitigation: "Weekly check of the critical path in the engineering meeting.",
      escalation: "Logged as a slip in the weekly report; milestone owner proposes either a compressed plan or a moved milestone date.",
      realised: false, severity: "Major" },
    { mode: "Client-facing document leakage",
      earlySign: "An internal specification, prompt, or harness artifact is included in a client-facing deliverable.",
      mitigation: "Client-facing outputs limited to the interface, the offered build, and the reports in Work Plan §10.",
      escalation: "Deliverable withdrawn and re-issued; leakage logged and source folder's access reviewed.",
      realised: false, severity: "Critical" },
  ]).onConflictDoNothing();

  // ---------- Dependencies (TOR 7.3 counterparts) ----------
  await db.insert(dependencies).values([
    { counterpart: "PNPKI", description: "Digital signature enrolment for signatories.",
      nextExpectedEvent: "Nomination submitted within 1 working week of NTP.",
      impactIfUnresolved: "M3 slips one-for-one with the delay.", rag: "amber", milestoneId: "M3" },
    { counterpart: "LGU HR", description: "Payroll cut-off dataset for seeding.",
      nextExpectedEvent: "Release within 2 working weeks of NTP.",
      impactIfUnresolved: "L1 seed data unavailable; M1 walkthrough deferred.", rag: "amber", milestoneId: "M1" },
    { counterpart: "GSIS", description: "Contribution schedule endpoint.",
      nextExpectedEvent: "Contract test against stub before M2.",
      impactIfUnresolved: "L2 red until stub replaced with real endpoint.", rag: "gray", milestoneId: "M2" },
    { counterpart: "BIR", description: "Withholding tax schedule endpoint.",
      nextExpectedEvent: "Contract test against stub before M2.",
      impactIfUnresolved: "L2 red on tax computation path.", rag: "gray", milestoneId: "M2" },
  ]).onConflictDoNothing();

  // ---------- Blockers (aging examples for KR 4.4) ----------
  const now = new Date();
  const dOffset = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  await db.insert(blockers).values([
    { id: "BLK-2026-0001", description: "Awaiting PNPKI counterpart contact to confirm nomination form.",
      relatedKrId: "KR 4.3", owner: "Sam", raisedAt: dOffset(5), targetResolveBy: dOffset(-2),
      escalated: true, escalatedAt: dOffset(3), notes: "Aging > 2 working days; escalated to leadership." },
    { id: "BLK-2026-0002", description: "Mayor exception dashboard prototype needs sign-off from Marcus.",
      relatedKrId: "KR 2.1", owner: "Marcus", raisedAt: dOffset(1), targetResolveBy: dOffset(-1), escalated: false },
    { id: "BLK-2026-0003", description: "Rule doc: net take-home floor citation missing.",
      relatedKrId: "KR 1.4", owner: "Sam", raisedAt: dOffset(4), targetResolveBy: dOffset(-2),
      escalated: true, escalatedAt: dOffset(2), notes: "Cannot cite the DBM circular version — chasing." },
    { id: "BLK-2026-0004", description: "Config console (XC-09) — no shift-left UAT scenario written.",
      relatedKrId: "KR 2.3", owner: "QA Lead (TBD)", raisedAt: dOffset(3), targetResolveBy: dOffset(0), escalated: true, escalatedAt: dOffset(1) },
    { id: "BLK-2026-0005", description: "Signing ceremony batch UAT: no worker device pool identified.",
      relatedKrId: "KR 2.3", owner: "QA Lead (TBD)", raisedAt: dOffset(2), targetResolveBy: dOffset(-1), escalated: false },
    { id: "BLK-2026-0006", description: "AI-first task tracker design: schema for auto-updating outline not finalised.",
      relatedKrId: "KR 4.2", owner: "Sam", raisedAt: dOffset(0), targetResolveBy: dOffset(-3), escalated: false },
    { id: "BLK-2026-0007", description: "Team clarifying pass — Franc not yet scheduled.",
      relatedKrId: "KR 5.1", owner: "Sam", raisedAt: dOffset(6), targetResolveBy: dOffset(-1),
      escalated: true, escalatedAt: dOffset(4), notes: "6 working days open — critical for KR 5.1 kickoff." },
    { id: "BLK-2026-0008", description: "Backlog sequencing: three visible modules to name.",
      relatedKrId: "KR 1.2", owner: "Sam", raisedAt: dOffset(1), resolvedAt: dOffset(0), escalated: false,
      notes: "Resolved: config console, mayor dashboard, worker counter-sign." },
  ]).onConflictDoNothing();

  // ---------- Stand-up entries ----------
  const days = [0, 1, 2, 3].map(dOffset);
  await db.insert(standupEntries).values([
    { date: days[0], owner: "Sam",
      moved: "Finalised OKR grades; kicked off HCM AI PM website scaffold.",
      blocked: "PNPKI counterpart still unresponsive.",
      next: "Ship Phase 1 MVP; run local seed against Neon dev branch." },
    { date: days[0], owner: "Marcus",
      moved: "Wireframe v3 — 12 more screens drafted (WP-04, WP-05, WP-06).",
      blocked: null,
      next: "Walk WP-04 through with Sam Wednesday." },
    { date: days[1], owner: "Sam",
      moved: "Draft risk register v1; identified 4 counterparts.",
      blocked: "Cannot cite DBM net-take-home circular version.",
      next: "Chase citation; publish v0.1 of risk register." },
    { date: days[1], owner: "Franc",
      moved: "MP-01 (worker offline capture) — 6 screens; MP-02 approvals mock.",
      blocked: "No borrowed-phone counter-sign scenario yet.",
      next: "Draft counter-sign flow diagram." },
    { date: days[2], owner: "Sam",
      moved: "Backlog recut sequenced by visibility (three visible modules named).",
      blocked: null,
      next: "Publish backlog v2 in Team Master workbook." },
    { date: days[2], owner: "Marcus",
      moved: "Component architecture PDF v2 shared with Eng review.",
      blocked: "Awaiting Eng Owner slot for architecture walk-through.",
      next: "Push for Wednesday review slot." },
    { date: days[3], owner: "Sam",
      moved: "Escalation rules v0.1 outline drafted.",
      blocked: null,
      next: "Circulate to Eng Owner before Wednesday meeting." },
  ]).onConflictDoNothing();

  // ---------- Documents (Command Center HOME sheet, ~15) ----------
  const P = String.raw`c:\Users\Samu\OneDrive\Pictures\Documents\supervaise meeting notes\HRIS`;
  await db.insert(documents).values([
    // Section A — Team workbooks
    { section: "A", title: "SAGIP · Team Master", purpose: "Whole-team dashboard — 11 sheets.", version: "current",
      ownerName: "Sam", updateCadence: "Weekly", status: "Current",
      filePath: `${P}\\POC\\SAGIP_Team_Master_Workbook.xlsx`, lastTouched: dOffset(2) },
    { section: "A", title: "SAGIP · Engineering", purpose: "Sprint backlog, velocity, AI-coding %, cycle time.",
      version: "current", ownerName: "Eng Owner", updateCadence: "Daily", status: "Current",
      filePath: `${P}\\POC\\SAGIP_Engineering_Sprint_Tracker.xlsx`, lastTouched: dOffset(4) },
    { section: "A", title: "SAGIP · QA / Testing", purpose: "UAT scenarios, test runs, issue backlog.",
      version: "current", ownerName: "QA Lead", updateCadence: "Per sprint", status: "Current",
      filePath: `${P}\\POC\\SAGIP_QA_Testing_Tracker.xlsx`, lastTouched: dOffset(7) },
    { section: "A", title: "SAGIP · Design", purpose: "120-screen progress, design system, persona feedback.",
      version: "current", ownerName: "Marcus + Franc", updateCadence: "Per sprint", status: "Current",
      filePath: `${P}\\POC\\SAGIP_Design_Prototype_Tracker.xlsx`, lastTouched: dOffset(3) },
    // Section B — Requirements
    { section: "B", title: "Product Development Work Plan", purpose: "Timeline, critical path, ceremonies, failure register.",
      version: "0.1", ownerName: "Sam", status: "Current",
      filePath: `${P}\\Plan\\Product_Development_Work_Plan.docx`, lastTouched: dOffset(4) },
    { section: "B", title: "HCM AI PM Website Spec", purpose: "This spec — arch, schema, agents, deploy.",
      version: "0.1", ownerName: "Sam", status: "Current",
      filePath: `${P}\\Plan\\HCM_AI_PM_Website_Spec.md`, lastTouched: dOffset(0) },
    { section: "B", title: "POC Procedure", purpose: "How a technical question is settled before it enters the build.",
      version: "current", ownerName: "Eng Owner", status: "Current",
      filePath: `${P}\\POC\\POC_Procedure.docx`, lastTouched: dOffset(30) },
    // Section C — Design
    { section: "C", title: "Wireframe v3 (120 screens)", purpose: "Latest wireframe, 12 role groups.",
      version: "v3", ownerName: "Marcus", status: "Current",
      filePath: `${P}\\01_Design\\`, lastTouched: dOffset(4) },
    { section: "C", title: "Mobile Architecture Blueprint", purpose: "Field-capture app architecture.",
      version: "v1", ownerName: "Franc", status: "Current",
      filePath: `${P}\\Data Model\\`, lastTouched: dOffset(10) },
    // Section D — Personas / QA
    { section: "D", title: "QA Persona Model · Web (WP-01..WP-12)", purpose: "12 web personas.", version: "v2.0",
      ownerName: "Marcus", status: "Current", filePath: `${P}\\Storyboard\\`, lastTouched: dOffset(4) },
    { section: "D", title: "QA Persona Model · Mobile (MP-01..MP-11)", purpose: "11 mobile personas.", version: "v2.3",
      ownerName: "Franc", status: "Current", filePath: `${P}\\Storyboard\\`, lastTouched: dOffset(4) },
    // Section E — Signing / Data / Harness / Plan
    { section: "E", title: "Harness Framework", purpose: "How a change is proved done. L1–L6.",
      version: "current", ownerName: "QA / Harness", status: "Current",
      filePath: `${P}\\Harness\\`, lastTouched: dOffset(30) },
    { section: "E", title: "Project Owner AI Agent Plan", purpose: "Seven agents that draft the PO's work.",
      version: "0.1", ownerName: "Sam", status: "Current",
      filePath: `${P}\\Agents\\Project_Owner_AI_Agent_Plan.docx`, lastTouched: dOffset(4) },
    // Section F — POCs
    { section: "F", title: "POC Index", purpose: "Every POC-2026-NNN report and outcome.", version: "current",
      ownerName: "Eng Owner", status: "Current", filePath: `${P}\\POC\\POC_Index.xlsx`, lastTouched: dOffset(2) },
    // Section G — OKR source
    { section: "G", title: "Project Owner OKR Pre-M1", purpose: "5 objectives, 21 KRs — Q3 2026.",
      version: "current", ownerName: "Sam", status: "Current",
      filePath: `${P}\\POC\\Project_Owner_OKR_PreM1.xlsx`, lastTouched: dOffset(1) },
  ]).onConflictDoNothing();

  // ---------- Sample ADRs / POCs / changes / harness / Jira (Phase 2 preview) ----------
  await db.insert(adrs).values([
    { id: "ADR-001", title: "Rules pack versioning", status: "Accepted",
      decision: "Rules pack is versioned per cut-off period; retroactive changes create a new version.",
      context: "M1 gate depends on frozen rules for the current cut-off.",
      consequences: "Every L1 test declares pack version; evidence records hash.",
      effectiveDate: dOffset(30), filePath: `${P}\\POC\\ADR\\ADR-001.docx` },
    { id: "ADR-003", title: "Semi-monthly split", status: "Accepted",
      decision: "Payroll cut-offs run on the 15th and end-of-month; both are frozen at M1.",
      context: "LGU HR payroll cadence.",
      effectiveDate: dOffset(20), filePath: `${P}\\POC\\ADR\\ADR-003.docx` },
    { id: "ADR-005", title: "PNPKI signing key custody", status: "Proposed",
      decision: "Signing keys held only on approved devices; manual fallback for M3 emergencies.",
      context: "Digital signature enrolment via PNPKI.", effectiveDate: null,
      filePath: `${P}\\POC\\ADR\\ADR-005.docx` },
  ]).onConflictDoNothing();

  await db.insert(pocs).values([
    { id: "POC-2026-001", title: "Rules pack DSL", question: "Can statutory rules be encoded as an agent-readable DSL?",
      owner: "Eng Owner", status: "done", outcome: "Yes — ADR-001 accepted.", linkedAdrId: "ADR-001",
      reportPath: `${P}\\POC\\POC-2026-001\\report.docx` },
    { id: "POC-2026-002", title: "Semi-monthly split", question: "Do split cut-offs simplify or complicate M1?",
      owner: "Eng Owner", status: "done", outcome: "Simpler — ADR-003 accepted.", linkedAdrId: "ADR-003",
      reportPath: `${P}\\POC\\POC-2026-002\\report.docx` },
    { id: "POC-2026-003", title: "PNPKI stub", question: "Can we stub PNPKI convincingly enough for L2?",
      owner: "Eng Owner", status: "in_progress", outcome: null,
      reportPath: `${P}\\POC\\POC-2026-003\\` },
    { id: "POC-2026-005", title: "Offline sync divergence", question: "How does mobile reconcile after a forced reconnect?",
      owner: "Franc", status: "in_progress", outcome: null, reportPath: `${P}\\POC\\POC-2026-005\\` },
  ]).onConflictDoNothing();

  await db.insert(harnessDefects).values([
    { id: "HRN-2026-0001", layer: "L1", title: "Casual staff type payroll off by 1 peso rounding",
      severity: "Minor", status: "in_progress", owner: "Eng Owner" },
    { id: "HRN-2026-0002", layer: "L3", title: "Exception route fires on auto-approvable case (rule R-14)",
      severity: "Major", status: "in_progress", owner: "Eng Owner" },
    { id: "HRN-2026-0003", layer: "L4", title: "Mobile forced-offline scenario not yet in fixture set",
      severity: "Major", status: "not_started", owner: "Franc" },
  ]).onConflictDoNothing();

  const cptRows = cpt.length ? cpt : await db.select().from(criticalPathTasks);
  const rulesTask = cptRows.find((t) => t.orderIx === 1);

  await db.insert(changes).values([
    { id: "CHG-2026-0001", title: "Rules pack DSL scaffolding", milestoneId: "M1",
      criticalPathTaskId: rulesTask?.id ?? null, owner: "Eng Owner", status: "done",
      specPath: `${P}\\Harness\\Changes\\CHG-2026-0001\\spec.md`,
      promptPath: `${P}\\Harness\\Changes\\CHG-2026-0001\\prompt.md`,
      evidencePath: `${P}\\Harness\\Changes\\CHG-2026-0001\\evidence\\`,
      mergedAt: dOffset(10) },
    { id: "CHG-2026-0002", title: "Payroll register drill-down UI (WP-04)", milestoneId: "M1",
      criticalPathTaskId: null, owner: "Marcus", status: "in_progress",
      specPath: `${P}\\Harness\\Changes\\CHG-2026-0002\\spec.md` },
    { id: "CHG-2026-0003", title: "Workflow engine — exception routing draft", milestoneId: "M2",
      criticalPathTaskId: null, owner: "Eng Owner", status: "not_started" },
  ]).onConflictDoNothing();

  await db.insert(jiraTickets).values([
    { key: "SAG-101", title: "Swimlane · Leave filing", owner: "Sam", sprint: "Pre-M1", krId: "KR 1.1",
      priority: "high", status: "Done", dueDate: dOffset(-4), onCriticalChain: false, raw: "{}" },
    { key: "SAG-102", title: "Swimlane · Biometric attendance", owner: "Sam", sprint: "Pre-M1", krId: "KR 1.1",
      priority: "high", status: "In Progress", dueDate: dOffset(-10), onCriticalChain: false, raw: "{}" },
    { key: "SAG-110", title: "Prototype · Mayor exception dashboard", owner: "Sam", sprint: "Pre-M1", krId: "KR 2.1",
      priority: "high", status: "In Progress", dueDate: dOffset(-12), onCriticalChain: true, raw: "{}" },
    { key: "SAG-111", title: "Prototype · Signing ceremony", owner: "Sam", sprint: "Pre-M1", krId: "KR 2.1",
      priority: "high", status: "To Do", dueDate: dOffset(-15), onCriticalChain: true, raw: "{}" },
    { key: "SAG-142", title: "AI-first task tracker · design draft", owner: "Sam", sprint: "Pre-M1", krId: "KR 4.2",
      priority: "medium", status: "In Progress", dueDate: dOffset(-20), onCriticalChain: false, raw: "{}" },
  ]).onConflictDoNothing();

  // ---------- Sample agent run ----------
  await db.insert(agentRuns).values([
    { id: "A1-2026-001", agentId: "A1", promptVersion: "v0.1", inputHash: "seed-fixture-01",
      rawOutput: "{ \"proposed_changes\": [], \"deferred\": [], \"flagged_no_milestone\": [] }",
      evidenceFolder: `${P}\\Agents\\Runs\\A1-2026-001\\` },
  ]).onConflictDoNothing();

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
