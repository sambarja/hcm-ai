export type TaskStatus = "not_started" | "in_progress" | "for_review" | "done" | "blocked";

export interface TaskComment {
  id: string;
  author: string;
  authorId: string;
  at: string;
  text: string;
}

export interface TaskChange {
  id: string;
  actor: string;
  actorId: string;
  at: string;
  from: TaskStatus | null;
  to: TaskStatus | null;
  note: string | null;
}

export interface Task {
  id: string;
  title: string;
  ownerId: string;
  ownerName: string;
  status: TaskStatus;
  milestone: string;
  driveLink: string | null;
  jiraLink: string | null;
  criticalPath: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  comments: TaskComment[];
  changeLog: TaskChange[];
}

export interface MeetingNote {
  id: string;
  meetingDate: string;
  chair: string;
  driveLink: string | null;
  summary: string;
  attendees: string[];
  discussion?: string;
  decisions?: string;
  actions?: string;
  concerns?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Concern {
  id: string;
  statement: string;
  raisedById: string;
  raisedByName: string;
  targetType: "task" | "document" | "meeting" | "milestone" | "general";
  targetId: string | null;
  impact: string;
  evidenceLink: string | null;
  status: "open" | "acknowledged" | "accepted" | "disputed" | "deferred" | "closed";
  leadershipResponse: string | null;
  respondedBy: string | null;
  respondedAt: string | null;
  createdAt: string;
}

export type Rag = "green" | "amber" | "red" | "gold" | "gray";
export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "at_risk"
  | "blocked"
  | "done"
  | "deferred";

export interface MilestoneOverride {
  status: MilestoneStatus;
  rag: Rag;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface OkrGrade {
  grade: number;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface DocumentExtraLink {
  id: string;
  label: string;
  url: string;
}

export interface DocumentOverride {
  description: string;
  extraLinks: DocumentExtraLink[];
  managedBy: string | null;
  updatedBy: string;
  updatedAt: string;
}

export interface Snapshot {
  tasks: Task[];
  meetings: MeetingNote[];
  concerns: Concern[];
  milestoneOverrides: Record<string, MilestoneOverride>;
  okrGrades: Record<string, OkrGrade>;
  documentOverrides: Record<string, DocumentOverride>;
}
