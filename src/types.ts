// Core domain types for the Personal Operating Model prototype.

export type Branch = 'root' | 'ethics' | 'worldview' | 'goals';
export type Stability = 'stable' | 'flexible';
/** Where an item comes from — shown as a source label on every question. */
export type SourceKind = 'research-informed' | 'adapted' | 'exploratory';
export type Provenance = 'human' | 'auto' | 'ai';

export type QuestionType = 'likert' | 'choice' | 'rank' | 'text' | 'goal';

export interface Option {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  nodeId: string;
  text: string;
  help?: string;
  type: QuestionType;
  /** For choice / rank questions. */
  options?: Option[];
  /** Override the default 5-point agreement anchors. */
  scale?: [string, string];
  /** Tags activated when this question is answered. */
  selfTags: string[];
  stability: Stability;
  source: SourceKind;
  /** Short citation / rationale for the source label. */
  sourceNote: string;
  askConfidence?: boolean;
  /** Turns an answer into a concise note line (the "automatic" generator). */
  note: (value: AnswerValue) => string;
}

export interface GoalAnswer {
  text: string;
  importance: number; // 1–10
}

export type AnswerValue = number | string | string[] | GoalAnswer;

export interface Response {
  value: AnswerValue;
  confidence?: number; // 1–5
  answeredAt: string; // ISO
  /** Previous answers to the same item (most recent last). */
  history?: { value: AnswerValue; confidence?: number; answeredAt: string }[];
}

export interface GraphNode {
  id: string;
  name: string;
  tag: string;
  branch: Branch;
  description: string;
  /** OR semantics: any active parent-tag makes the node available. */
  parentTags: string[];
  /** Topic file the node's notes live in (root has none). */
  fileId?: string;
}

export interface NodeProgress {
  startedAt?: string;
  completedAt?: string;
  submissions: string[];
}

export type EntryKind = 'h' | 'p' | 'li' | 'quote';

export interface Entry {
  id: string;
  kind: EntryKind;
  text: string;
  createdAt: string;
  updatedAt: string;
  provenance: Provenance;
  sourceItemId?: string;
  locked: boolean;
}

export interface FileVersion {
  versionId: string;
  createdAt: string;
  reason: string;
  entries: Entry[];
}

export type ProposalKind = 'generated-update' | 'summary' | 'reset';

export interface Proposal extends FileVersion {
  kind: ProposalKind;
  /** Entry ids an automatic update wanted to change but kept because they are locked. */
  protectedIds: string[];
}

export interface NoteFile {
  id: string; // e.g. "ethics/family-obligations"
  dir: 'ethics' | 'worldview' | 'long-term-goals';
  name: string; // e.g. "family-obligations"
  title: string;
  current: FileVersion;
  /** Most recent last; capped at 5. */
  history: FileVersion[];
  proposal?: Proposal;
}

export type Tab =
  | { kind: 'graph' }
  | { kind: 'file'; fileId: string }
  | { kind: 'questionnaire'; nodeId: string }
  | { kind: 'onboarding' };

export type FileMode = 'notes' | 'history' | 'changes';

export type Profile = 'fresh' | 'sample';
