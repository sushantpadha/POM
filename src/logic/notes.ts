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
          text: 'From your answers',
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
 * Simulated summarisation. Only generated lines (pencil and robot) are condensed;
 * the user's own lines and locked lines are kept verbatim and in place.
 */
export function summarize(
  file: NoteFile,
  predefined: string[] | undefined,
  now = nowIso(),
): Proposal | null {
  const current = file.current.entries;
  const keep = (e: Entry) => e.locked || e.provenance === 'human';
  const generated = current.filter((e) => !keep(e));
  if (generated.length < 2) return null;
  return buildSummary(file, predefined?.length ? predefined : fallbackSummary(generated), now);
}

/**
 * A branch's main file summarises its topic files: one short line per topic
 * file that has notes. Rule-based; no AI is involved.
 */
export function summarizeBranch(main: NoteFile, topics: NoteFile[], now = nowIso()): Proposal | null {
  const lines = topics
    .map((t) => {
      const body = t.current.entries.filter((e) => e.kind !== 'h');
      if (!body.length) return null;
      const first = shorten(plain(body[0].text));
      return `${t.title}: ${first}${body.length > 1 ? ` (+${body.length - 1} more in [[${t.id}]])` : ''}`;
    })
    .filter((x): x is string => !!x);
  if (!lines.length) return null;
  return buildSummary(main, lines, now);
}

function buildSummary(file: NoteFile, lines: string[], now: string): Proposal {
  const current = file.current.entries;
  const keep = (e: Entry) => e.locked || e.provenance === 'human';
  const summaryEntries: Entry[] = [
    { id: uid('e'), kind: 'h', text: 'Summary', createdAt: now, updatedAt: now, provenance: 'ai', locked: false },
    ...lines.map((text): Entry => ({ id: uid('e'), kind: 'li', text, createdAt: now, updatedAt: now, provenance: 'ai', locked: false })),
  ];
  // The summary goes where the first replaced line was; kept lines stay where they are.
  const entries: Entry[] = [];
  let inserted = false;
  for (const e of current) {
    if (keep(e)) entries.push(e);
    else if (!inserted) {
      entries.push(...summaryEntries);
      inserted = true;
    }
  }
  if (!inserted) entries.unshift(...summaryEntries);
  return {
    versionId: uid('v'),
    createdAt: now,
    reason: 'Summary',
    entries,
    kind: 'summary',
    protectedIds: current.filter(keep).map((e) => e.id),
  };
}

function shorten(s: string): string {
  const first = s.split(/(?<=[.!?”])\s/)[0];
  return first.length > 110 ? `${first.slice(0, 107).trimEnd()}…` : first;
}

function plain(text: string): string {
  return text
    .replace(/\*\*|\*|`/g, '')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/^In my words: /, '');
}

function fallbackSummary(entries: Entry[]): string[] {
  const body = entries.filter((e) => e.kind !== 'h').map((e) => shorten(plain(e.text)));
  const out: string[] = [];
  for (let i = 0; i < body.length; i += 2) out.push(body.slice(i, i + 2).join(' '));
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
