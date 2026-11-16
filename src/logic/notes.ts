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

export interface ApplyResult {
  changed: boolean;
  /** Locked lines this answer wanted to change but kept. */
  protectedIds: string[];
}

const lineKind = (q: Question): Entry['kind'] => (q.type === 'text' ? 'quote' : 'li');

/** Dated prefix for check-in (log) lines. */
export function logDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function newEntry(q: Question, text: string, now: string, extra: Partial<Entry> = {}): Entry {
  return { id: uid('e'), kind: lineKind(q), text, createdAt: now, updatedAt: now, provenance: 'auto', sourceItemId: q.id, locked: false, ...extra };
}

/**
 * Writes one answer into a list of note lines (mutates `entries`). One generated line per
 * question, keyed by its source item id:
 *  - existing unlocked generated line → text refreshed
 *  - a locked line is never changed: it is kept (and reported) and the new answer goes on a
 *    line right after it
 *  - lines the user wrote or edited are never touched; a new line goes after an edited one
 *  - an empty note (or no answer) removes the unlocked generated line
 *  - `log` questions append a dated line per check-in; within the same run (lines created
 *    after `runStart`, the previous completion) the line is replaced instead
 *  - the response's "Add a note" text is kept as a human line just under the answer
 */
export function applyAnswer(
  entries: Entry[],
  q: Question,
  res: Response | undefined,
  now = nowIso(),
  runStart?: string,
): ApplyResult {
  const out: ApplyResult = { changed: false, protectedIds: [] };
  const text = res ? q.note(res.value) : '';
  const mine = (e: Entry) => e.sourceItemId === q.id && !e.answerNote;

  let anchor: Entry | undefined;
  if (q.log) {
    const lines = entries.filter((e) => mine(e) && e.provenance === 'auto');
    const latest = lines[lines.length - 1];
    const inRun = latest && (!runStart || latest.createdAt > runStart) ? latest : undefined;
    const dated = text ? `${logDate(now)} — ${text}` : '';
    if (!dated) {
      if (inRun && !inRun.locked) {
        entries.splice(entries.indexOf(inRun), 1);
        out.changed = true;
      }
    } else if (inRun) {
      anchor = inRun;
      if (inRun.text !== dated) {
        if (inRun.locked) {
          out.protectedIds.push(inRun.id);
          anchor = newEntry(q, dated, now);
          entries.splice(entries.indexOf(inRun) + 1, 0, anchor);
        } else {
          inRun.text = dated;
          inRun.updatedAt = now;
        }
        out.changed = true;
      }
    } else {
      anchor = newEntry(q, dated, now);
      entries.push(anchor);
      out.changed = true;
    }
  } else {
    const generated = entries.filter((e) => mine(e) && e.provenance !== 'human');
    const unlocked = generated.find((e) => !e.locked);
    const lockedLine = [...generated].reverse().find((e) => e.locked);
    if (!text || (unlocked && lockedLine?.text === text)) {
      // No answer, or the answer is back to what the locked line already says.
      if (unlocked) {
        entries.splice(entries.indexOf(unlocked), 1);
        out.changed = true;
      }
      anchor = text ? lockedLine : undefined;
    } else if (unlocked) {
      anchor = unlocked;
      if (unlocked.text !== text) {
        unlocked.text = text;
        unlocked.kind = lineKind(q);
        unlocked.provenance = 'auto';
        unlocked.updatedAt = now;
        out.changed = true;
      }
    } else if (lockedLine) {
      anchor = lockedLine;
      if (lockedLine.text !== text) {
        out.protectedIds.push(lockedLine.id);
        anchor = newEntry(q, text, now);
        entries.splice(entries.indexOf(lockedLine) + 1, 0, anchor);
        out.changed = true;
      }
    } else {
      // A line the user edited from this answer stays; the fresh line goes right after it.
      const edited = [...entries].reverse().find((e) => mine(e) && e.provenance === 'human');
      anchor = newEntry(q, text, now);
      if (edited) entries.splice(entries.indexOf(edited) + 1, 0, anchor);
      else entries.push(anchor);
      out.changed = true;
    }
  }

  // "Add a note": the user's own words, saved as a human line under the answer.
  const noteText = res?.note?.trim();
  const noteLine = [...entries].reverse().find((e) => e.answerNote && e.sourceItemId === q.id);
  const wanted = noteText ? `In my words: ${noteText}` : '';
  const noteInRun = noteLine && (!q.log || !runStart || noteLine.createdAt > runStart) ? noteLine : undefined;
  if (wanted) {
    if (noteInRun) {
      if (noteInRun.text !== wanted) {
        if (noteInRun.locked) out.protectedIds.push(noteInRun.id);
        else {
          noteInRun.text = wanted;
          noteInRun.updatedAt = now;
          out.changed = true;
        }
      }
    } else {
      const line: Entry = { ...newEntry(q, wanted, now), kind: 'li', provenance: 'human', answerNote: true };
      const at = anchor ? entries.indexOf(anchor) : -1;
      if (at >= 0) entries.splice(at + 1, 0, line);
      else entries.push(line);
      out.changed = true;
    }
  } else if (noteInRun && !noteInRun.locked && res) {
    entries.splice(entries.indexOf(noteInRun), 1);
    out.changed = true;
  }
  return out;
}

/**
 * Writes all current answers for these questions into a copy of the file's lines (used when a
 * topic is reset but its answers are kept). See `applyAnswer` for the line rules. Questions
 * hidden by a gate are skipped. Returns null when nothing would change.
 */
export function regenerate(
  file: NoteFile,
  questions: Question[],
  responses: Record<string, Response>,
  now = nowIso(),
  runStart?: string,
): { entries: Entry[]; protectedIds: string[] } | null {
  const entries = file.current.entries.map((e) => ({ ...e }));
  const protectedIds: string[] = [];
  let changed = false;

  for (const q of questions) {
    const res = responses[q.id];
    if (!res || (q.showIf && !q.showIf(responses))) continue;
    const r = applyAnswer(entries, q, res, now, runStart);
    changed ||= r.changed;
    protectedIds.push(...r.protectedIds);
  }
  if (!changed && protectedIds.length === 0) return null;
  return { entries, protectedIds };
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
 * A branch's main file holds answers of its own and also summarises its topic files:
 * its own generated lines are condensed first, then one short line per topic file
 * that has notes. Rule-based; no AI is involved.
 */
export function summarizeBranch(main: NoteFile, topics: NoteFile[], now = nowIso()): Proposal | null {
  const generated = main.current.entries.filter((e) => !e.locked && e.provenance !== 'human');
  const own = fallbackSummary(generated);
  const topicLines = topics
    .map((t) => {
      const body = t.current.entries.filter((e) => e.kind !== 'h');
      if (!body.length) return null;
      const first = shorten(plain(body[0].text));
      return `${t.title}: ${first}${body.length > 1 ? ` (+${body.length - 1} more in [[${t.id}]])` : ''}`;
    })
    .filter((x): x is string => !!x);
  const lines = [...own, ...topicLines];
  if (!topicLines.length && generated.length < 2) return null;
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
