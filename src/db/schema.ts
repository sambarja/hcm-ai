import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  boolean,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// ---------- Enums ----------
export const statusEnum = pgEnum("status", [
  "not_started",
  "in_progress",
  "at_risk",
  "blocked",
  "done",
  "deferred",
]);
export const ragEnum = pgEnum("rag", ["green", "amber", "red", "gold", "gray"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "critical"]);
export const krTypeEnum = pgEnum("kr_type", ["committed", "aspirational"]);
export const agentIdEnum = pgEnum("agent_id", ["A1", "A2", "A3", "A4", "A5", "A6", "A7"]);
export const milestoneIdEnum = pgEnum("milestone_id", [
  "M0",
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "MR",
]);

// ---------- Milestones ----------
export const milestones = pgTable("milestones", {
  id: milestoneIdEnum("id").primaryKey(),
  name: text("name").notNull(),
  weeksFromNtp: text("weeks_from_ntp").notNull(),
  targetDate: timestamp("target_date", { mode: "date" }),
  deliverable: text("deliverable").notNull(),
  acceptanceOracle: text("acceptance_oracle"),
  exitCondition: text("exit_condition"),
  internalPredecessor: text("internal_predecessor"),
  status: statusEnum("status").notNull().default("not_started"),
  rag: ragEnum("rag").notNull().default("gray"),
  closureRecordPath: text("closure_record_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Critical-path tasks + non-critical slack ----------
export const criticalPathTasks = pgTable(
  "critical_path_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderIx: integer("order_ix").notNull(),
    task: text("task").notNull(),
    reason: text("reason").notNull(),
    owner: text("owner").notNull(),
    revealsSlipIn: text("reveals_slip_in").notNull(),
    onCriticalPath: boolean("on_critical_path").notNull().default(true),
    slackDays: integer("slack_days"),
    entersCriticalPathIf: text("enters_critical_path_if"),
    plannedStart: timestamp("planned_start", { mode: "date" }),
    plannedFinish: timestamp("planned_finish", { mode: "date" }),
    actualStart: timestamp("actual_start", { mode: "date" }),
    actualFinish: timestamp("actual_finish", { mode: "date" }),
    status: statusEnum("status").notNull().default("not_started"),
    milestoneId: milestoneIdEnum("milestone_id").references(() => milestones.id),
  },
  (t) => ({
    milestoneIdx: index("cpt_milestone_idx").on(t.milestoneId),
    onPathIdx: index("cpt_on_path_idx").on(t.onCriticalPath),
  }),
);

// ---------- Objectives (5) ----------
export const objectives = pgTable("objectives", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  quarter: text("quarter").notNull(),
});

// ---------- Key Results (21) ----------
export const keyResults = pgTable(
  "key_results",
  {
    id: text("id").primaryKey(),
    objectiveId: integer("objective_id")
      .notNull()
      .references(() => objectives.id),
    krNumber: text("kr_number").notNull(),
    description: text("description").notNull(),
    target: text("target").notNull(),
    type: krTypeEnum("type").notNull(),
    grade: real("grade"),
    reference: text("reference"),
    owner: text("owner"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    objIdx: index("kr_objective_idx").on(t.objectiveId),
  }),
);

// ---------- Change log ----------
export const changes = pgTable("changes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  milestoneId: milestoneIdEnum("milestone_id").references(() => milestones.id),
  criticalPathTaskId: uuid("critical_path_task_id").references(() => criticalPathTasks.id),
  owner: text("owner").notNull(),
  status: statusEnum("status").notNull(),
  specPath: text("spec_path"),
  promptPath: text("prompt_path"),
  evidencePath: text("evidence_path"),
  reviewPath: text("review_path"),
  mergedAt: timestamp("merged_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- POC index ----------
export const pocs = pgTable("pocs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  question: text("question").notNull(),
  owner: text("owner").notNull(),
  status: statusEnum("status").notNull(),
  outcome: text("outcome"),
  linkedAdrId: text("linked_adr_id"),
  reportPath: text("report_path"),
  charterPath: text("charter_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- ADR index ----------
export const adrs = pgTable("adrs", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull(),
  decision: text("decision").notNull(),
  context: text("context"),
  consequences: text("consequences"),
  supersedes: text("supersedes"),
  supersededBy: text("superseded_by"),
  effectiveDate: timestamp("effective_date", { mode: "date" }),
  filePath: text("file_path"),
});

// ---------- Harness defects ----------
export const harnessDefects = pgTable("harness_defects", {
  id: text("id").primaryKey(),
  layer: text("layer").notNull(),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  status: statusEnum("status").notNull(),
  owner: text("owner").notNull(),
  raisedAt: timestamp("raised_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

// ---------- Dependencies ----------
export const dependencies = pgTable("dependencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  counterpart: text("counterpart").notNull(),
  description: text("description").notNull(),
  lastContact: timestamp("last_contact"),
  nextExpectedEvent: text("next_expected_event"),
  impactIfUnresolved: text("impact_if_unresolved"),
  rag: ragEnum("rag").notNull().default("gray"),
  milestoneId: milestoneIdEnum("milestone_id"),
});

// ---------- Risks ----------
export const risks = pgTable("risks", {
  id: uuid("id").primaryKey().defaultRandom(),
  mode: text("mode").notNull(),
  earlySign: text("early_sign").notNull(),
  mitigation: text("mitigation").notNull(),
  escalation: text("escalation").notNull(),
  realised: boolean("realised").notNull().default(false),
  severity: text("severity"),
  milestoneId: milestoneIdEnum("milestone_id"),
  mitigationLastMovedAt: timestamp("mitigation_last_moved_at"),
});

// ---------- Team ----------
export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  primaryWorkbook: text("primary_workbook"),
  krsOwned: text("krs_owned"),
  reportsTo: text("reports_to"),
  contact: text("contact"),
  timezone: text("timezone"),
  notes: text("notes"),
});

// ---------- Stand-up log ----------
export const standupEntries = pgTable(
  "standup_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    date: timestamp("date", { mode: "date" }).notNull(),
    owner: text("owner").notNull(),
    moved: text("moved").notNull(),
    blocked: text("blocked"),
    next: text("next").notNull(),
  },
  (t) => ({
    dateIdx: index("standup_date_idx").on(t.date),
  }),
);

// ---------- Blockers ----------
export const blockers = pgTable("blockers", {
  id: text("id").primaryKey(),
  description: text("description").notNull(),
  relatedKrId: text("related_kr_id").references(() => keyResults.id),
  criticalPathTaskId: uuid("critical_path_task_id").references(() => criticalPathTasks.id),
  owner: text("owner").notNull(),
  raisedAt: timestamp("raised_at").notNull().defaultNow(),
  targetResolveBy: timestamp("target_resolve_by", { mode: "date" }),
  resolvedAt: timestamp("resolved_at"),
  escalated: boolean("escalated").notNull().default(false),
  escalatedAt: timestamp("escalated_at"),
  notes: text("notes"),
});

// ---------- Agent runs ----------
export const agentRuns = pgTable(
  "agent_runs",
  {
    id: text("id").primaryKey(),
    agentId: agentIdEnum("agent_id").notNull(),
    promptVersion: text("prompt_version").notNull(),
    inputHash: text("input_hash").notNull(),
    rawOutput: text("raw_output").notNull(),
    signedBy: text("signed_by"),
    signedAt: timestamp("signed_at"),
    evidenceFolder: text("evidence_folder").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    agentIdx: index("agent_run_agent_idx").on(t.agentId),
    createdIdx: index("agent_run_created_idx").on(t.createdAt),
  }),
);

// ---------- Jira ticket cache ----------
export const jiraTickets = pgTable("jira_tickets", {
  key: text("key").primaryKey(),
  title: text("title").notNull(),
  owner: text("owner"),
  sprint: text("sprint"),
  krId: text("kr_id").references(() => keyResults.id),
  priority: priorityEnum("priority"),
  status: text("status"),
  dueDate: timestamp("due_date", { mode: "date" }),
  onCriticalChain: boolean("on_critical_chain").notNull().default(false),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  raw: text("raw"),
});

// ---------- Documents ----------
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  section: text("section").notNull(),
  title: text("title").notNull(),
  purpose: text("purpose"),
  version: text("version"),
  ownerName: text("owner_name"),
  updateCadence: text("update_cadence"),
  status: text("status"),
  filePath: text("file_path").notNull(),
  lastTouched: timestamp("last_touched", { mode: "date" }),
});
