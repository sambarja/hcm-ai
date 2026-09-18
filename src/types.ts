/**
 * TypeScript types for the JSON data files under src/data/*.json.
 *
 * Phase 1 is a read-only static site — every page imports one of these
 * JSON files directly and casts to the matching interface below.
 * When Phase 2 introduces write operations, replace the JSON imports
 * with a database client and keep these types (or move them to a shared
 * schema module). See Plan/HCM_AI_PM_Website_Spec.md for the full model.
 *
 * Dates are ISO strings ("2027-01-15"). Convert to Date at the render
 * boundary with `new Date(str)` when a component needs date-fns helpers.
 */

export type Status =
  | "not_started"
  | "in_progress"
  | "at_risk"
  | "blocked"
  | "done"
  | "deferred";

export type Rag = "green" | "amber" | "red" | "gold" | "gray";
export type Priority = "low" | "medium" | "high" | "critical";
export type KrType = "committed" | "aspirational";
export type AgentId = "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7";
export type MilestoneId = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "MR";

/** Convenience: RAG bucket for a KR grade. */
export type KRStatus = "green" | "amber" | "red" | "gray";

export interface Milestone {
  id: MilestoneId;
  name: string;
  weeksFromNtp: string;
  targetDate: string | null;
  deliverable: string;
  acceptanceOracle: string | null;
  exitCondition: string | null;
  internalPredecessor: string | null;
  status: Status;
  rag: Rag;
  closureRecordPath: string | null;
}

export interface CriticalPathTask {
  id: string;
  orderIx: number;
  task: string;
  reason: string;
  owner: string;
  revealsSlipIn: string;
  onCriticalPath: boolean;
  slackDays: number | null;
  entersCriticalPathIf: string | null;
  plannedStart: string | null;
  plannedFinish: string | null;
  actualStart: string | null;
  actualFinish: string | null;
  status: Status;
  milestoneId: MilestoneId | null;
}

export interface Objective {
  id: number;
  title: string;
  description: string | null;
  quarter: string;
}

export interface KeyResult {
  id: string;
  objectiveId: number;
  krNumber: string;
  description: string;
  target: string;
  type: KrType;
  grade: number | null;
  reference: string | null;
  owner: string | null;
}

export interface Change {
  id: string;
  title: string;
  milestoneId: MilestoneId | null;
  criticalPathTaskId: string | null;
  owner: string;
  status: Status;
  specPath: string | null;
  promptPath: string | null;
  evidencePath: string | null;
  reviewPath: string | null;
  mergedAt: string | null;
}

export interface Poc {
  id: string;
  title: string;
  question: string;
  owner: string;
  status: Status;
  outcome: string | null;
  linkedAdrId: string | null;
  reportPath: string | null;
  charterPath: string | null;
}

export interface Adr {
  id: string;
  title: string;
  status: string;
  decision: string;
  context: string | null;
  consequences: string | null;
  supersedes: string | null;
  supersededBy: string | null;
  effectiveDate: string | null;
  filePath: string | null;
}

export interface HarnessDefect {
  id: string;
  layer: string;
  title: string;
  severity: string;
  status: Status;
  owner: string;
  raisedAt: string;
  closedAt: string | null;
}

export interface Dependency {
  id: string;
  counterpart: string;
  description: string;
  lastContact: string | null;
  nextExpectedEvent: string | null;
  impactIfUnresolved: string | null;
  rag: Rag;
  milestoneId: MilestoneId | null;
}

export interface Risk {
  id: string;
  mode: string;
  earlySign: string;
  mitigation: string;
  escalation: string;
  realised: boolean;
  severity: string | null;
  milestoneId: MilestoneId | null;
  mitigationLastMovedAt: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  primaryWorkbook: string | null;
  krsOwned: string | null;
  reportsTo: string | null;
  contact: string | null;
  timezone: string | null;
  notes: string | null;
}

export interface StandupEntry {
  id: string;
  date: string;
  owner: string;
  moved: string;
  blocked: string | null;
  next: string;
}

export interface Blocker {
  id: string;
  description: string;
  relatedKrId: string | null;
  criticalPathTaskId: string | null;
  owner: string;
  raisedAt: string;
  targetResolveBy: string | null;
  resolvedAt: string | null;
  escalated: boolean;
  escalatedAt: string | null;
  notes: string | null;
}

export interface AgentRun {
  id: string;
  agentId: AgentId;
  promptVersion: string;
  inputHash: string;
  rawOutput: string;
  signedBy: string | null;
  signedAt: string | null;
  evidenceFolder: string;
  createdAt: string;
}

export interface JiraTicket {
  key: string;
  title: string;
  owner: string | null;
  sprint: string | null;
  krId: string | null;
  priority: Priority | null;
  status: string | null;
  dueDate: string | null;
  onCriticalChain: boolean;
  lastSyncedAt: string;
  raw: string | null;
}

export interface DocumentEntry {
  id: string;
  section: string;
  title: string;
  purpose: string | null;
  version: string | null;
  ownerName: string | null;
  updateCadence: string | null;
  status: string | null;
  filePath: string;
  lastTouched: string | null;
}
