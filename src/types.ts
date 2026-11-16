// Core domain types for the Personal Operating Model prototype.

export type Branch = 'root' | 'worldview' | 'moral' | 'priorities' | 'identity' | 'goals';
export type Dir = 'worldview' | 'moral' | 'priorities' | 'identity' | 'goals' | 'check-ins';
export type Stability = 'stable' | 'flexible';
/**
 * Where an item comes from (matches the writeup's Source column):
 *  - adapted: paraphrased from a published instrument, not administered in full
 *  - informed: our own wording, informed by a research construct
 *  - new: our own exploratory question
 */
export type SourceKind = 'adapted' | 'informed' | 'new';
export type Provenance = 'human' | 'auto' | 'ai';

export type QuestionType = 'likert' | 'choice' | 'multi' | 'rank' | 'text' | 'slider' | 'sliders' | 'project';

export interface Option {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  nodeId: string;
  text: string;
  help?: string;
  /** Shown behind "Why we ask this". Falls back to the source note. */
  why?: string;
  type: QuestionType;
  /** For choice / multi / rank questions. */
  options?: Option[];
  /** Multi-select: the most options that can be picked. */
  max?: number;
  /** Multi-select: an option ("None of these", "Not sure yet") that clears the others when picked. */
  exclusive?: string;
  /** Example answer shown in an empty text box. */
  placeholder?: string;
  /** For sliders / project questions: one 0–10 slider per option. */
  sliders?: Option[];
  /** End labels for agreement scales and 0–10 sliders. */
  scale?: [string, string];
  /** Notes files this answer updates. */
  fileIds: string[];
  /**
   * Static superset of the tags this question can activate. Used to derive graph edges and
   * validate the DAG; also the activated tags unless `tagsFor` is given.
   */
  selfTags: string[];
  /** Value-dependent tags. When present it replaces `selfTags` for activation. */
  tagsFor?: (value: AnswerValue) => string[];
  /** Hidden questions are skipped by the runner and left out of progress counts. */
  showIf?: (responses: Record<string, Response>) => boolean;
  /** Each answer appends a dated line instead of replacing the previous one (monthly check-in). */
  log?: boolean;
  stability: Stability;
  source: SourceKind;
  /** Short citation / rationale for the source label. */
  sourceNote: string;
  askConfidence?: boolean;
  /** Turns an answer into a concise note line (the "automatic" generator). */
  note: (value: AnswerValue) => string;
}

/** Free text plus 0–10 ratings, e.g. a personal project with importance and control. */
export interface ProjectAnswer {
  text: string;
  ratings: Record<string, number>;
}

export type AnswerValue = number | string | string[] | Record<string, number> | ProjectAnswer;

export interface Response {
  value: AnswerValue;
  confidence?: number; // 1–5
  answeredAt: string; // ISO
  /** The optional "Add a note" text, kept as the user's own line under the generated one. */
  note?: string;
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
  /** Set on the line that holds a response's "Add a note" text. */
  answerNote?: boolean;
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
  id: string; // e.g. "moral/family-duty"
  dir: Dir;
  name: string; // e.g. "family-duty"
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
