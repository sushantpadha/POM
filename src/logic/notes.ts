import type { Entry, FileVersion, NoteFile, Proposal, Question, Response } from '../types';

export const MAX_HISTORY = 5;

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
}

export const nowIso = () => new Date().toISOString();

/** Commit a new current version: the old current moves into history (capped at 5). */
export function commitVersion(file: NoteFile, next: FileVersion): NoteFile {
  return {
    ...file,
    history: [...file.history, file.current].slice(-MAX_HISTORY),
    current: next,
    proposal: undefined,
  };
}

/**
 * Build an automatic update from questionnaire responses. Each answered question
 * produces one "auto" line keyed by its source item id:
 *  - existing non-human line for that item → text refreshed (unless locked)
 *  - locked line → kept verbatim and reported in `protectedIds`
 *  - human-written lines are never touched
 */
export function generateUpdate(
  file: NoteFile,
  questions: Question[],
  responses: Record<string, Response>,
  reason: string,
  now = nowIso(),
): Proposal | null {
  const entries = file.current.entries.map((e) => ({ ...e }));
  const protectedIds: string[] = [];
  let changed = false;

  for (const q of questions) {
    const res = responses[q.id];
    if (!res) continue;
    const text = q.note(res.value);
    if (!text) continue;
    const kind = q.type === 'text' ? 'quote' : 'li';
    const existing = entries.find((e) => e.sourceItemId === q.id && e.provenance !== 'human');
    if (existing) {
      if (existing.text === text) continue;
      if (existing.locked) {
        protectedIds.push(existing.id);
        continue;
      }
      existing.text = text;
      existing.kind = kind;
      existing.provenance = 'auto';
      existing.updatedAt = now;
      changed = true;
    } else {
      if (!entries.some((e) => e.kind === 'h')) {
        entries.unshift({
          id: uid('e'),
          kind: 'h',
          text: 'From assessments',
          createdAt: now,
          updatedAt: now,
          provenance: 'auto',
          locked: false,
        });
      }
      entries.push({
        id: uid('e'),
        kind,
        text,
        createdAt: now,
        updatedAt: now,
        provenance: 'auto',
        sourceItemId: q.id,
        locked: false,
      });
      changed = true;
    }
  }
  if (!changed && protectedIds.length === 0) return null;
  return {
    versionId: uid('v'),
    createdAt: now,
    reason,
    entries,
    kind: 'generated-update',
    protectedIds,
  };
}

/**
 * Simulated summarisation. Locked lines are kept verbatim and in place; every
 * other line is replaced by a shorter, predefined (or rule-based) AI summary.
 */
export function summarize(
  file: NoteFile,
  predefined: string[] | undefined,
  now = nowIso(),
): Proposal | null {
  const current = file.current.entries;
  const unlocked = current.filter((e) => !e.locked);
  if (unlocked.length < 2) return null;

  const lines = predefined?.length ? predefined : fallbackSummary(unlocked);
  const summaryEntries: Entry[] = lines.map((text, i) => ({
    id: uid('e'),
    kind: i === 0 && !predefined ? 'h' : 'li',
    text,
    createdAt: now,
    updatedAt: now,
    provenance: 'ai',
    locked: false,
  }));
  if (predefined?.length) {
    summaryEntries.unshift({
      id: uid('e'),
      kind: 'h',
      text: 'Summary',
      createdAt: now,
      updatedAt: now,
      provenance: 'ai',
      locked: false,
    });
  }

  // Keep locked lines exactly where they were; place the summary where the first unlocked line was.
  const entries: Entry[] = [];
  let inserted = false;
  for (const e of current) {
    if (e.locked) entries.push(e);
    else if (!inserted) {
      entries.push(...summaryEntries);
      inserted = true;
    }
  }
  return {
    versionId: uid('v'),
    createdAt: now,
    reason: 'AI summary (simulated)',
    entries,
    kind: 'summary',
    protectedIds: current.filter((e) => e.locked).map((e) => e.id),
  };
}

function plain(text: string): string {
  return text
    .replace(/\*\*|\*|`/g, '')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/^In my words: /, '');
}

function fallbackSummary(entries: Entry[]): string[] {
  const body = entries.filter((e) => e.kind !== 'h');
  const sentences = body.map((e) => {
    const s = plain(e.text).split(/(?<=[.!?”])\s/)[0];
    return s.length > 110 ? `${s.slice(0, 107).trimEnd()}…` : s;
  });
  const out = ['Condensed notes'];
  for (let i = 0; i < sentences.length; i += 2) {
    out.push(sentences.slice(i, i + 2).join(' '));
  }
  return out;
}

export type DiffKind = 'added' | 'removed' | 'changed' | 'same';
export interface DiffRow {
  kind: DiffKind;
  entry: Entry;
  before?: Entry;
}

/** Line-level diff keyed by entry id (entries keep their id across edits). */
export function diffVersions(oldV: FileVersion, newV: FileVersion): DiffRow[] {
  const newIds = new Set(newV.entries.map((e) => e.id));
  const oldById = new Map(oldV.entries.map((e) => [e.id, e]));
  const rows: DiffRow[] = [];
  let oi = 0;
  const flushRemoved = (uptoId?: string) => {
    while (oi < oldV.entries.length && oldV.entries[oi].id !== uptoId) {
      const o = oldV.entries[oi];
      if (!newIds.has(o.id)) rows.push({ kind: 'removed', entry: o });
      oi++;
    }
  };
  for (const e of newV.entries) {
    const before = oldById.get(e.id);
    if (!before) {
      rows.push({ kind: 'added', entry: e });
      continue;
    }
    flushRemoved(e.id);
    oi++;
    rows.push(
      before.text !== e.text || before.kind !== e.kind
        ? { kind: 'changed', entry: e, before }
        : { kind: 'same', entry: e },
    );
  }
  flushRemoved();
  return rows;
}

export function diffStats(rows: DiffRow[]) {
  return {
    added: rows.filter((r) => r.kind === 'added').length,
    removed: rows.filter((r) => r.kind === 'removed').length,
    changed: rows.filter((r) => r.kind === 'changed').length,
  };
}
