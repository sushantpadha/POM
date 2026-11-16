import { describe, expect, it } from 'vitest';
import type { Entry, NoteFile, Response } from '../types';
import { QUESTION_BY_ID } from '../data/questions';
import { sampleFiles, SAMPLE_PROGRESS, SAMPLE_RESPONSES } from '../data/sampleProfile';
import { applyAnswer, commitVersion, diffVersions, MAX_HISTORY, regenerate, summarize, summarizeBranch } from './notes';
import { detectTensions } from './tensions';
import { suggestRetakes } from './retakes';
import { thenAndNow } from './thenNow';

const entry = (id: string, text: string, extra: Partial<Entry> = {}): Entry => ({
  id,
  kind: 'li',
  text,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  provenance: 'auto',
  locked: false,
  ...extra,
});

const file = (entries: Entry[]): NoteFile => ({
  id: 'moral/main',
  dir: 'moral',
  name: 'main',
  title: 't',
  history: [],
  current: { versionId: 'v0', createdAt: '2026-01-01T00:00:00Z', reason: 'x', entries },
});

const r = (value: Response['value'], extra: Partial<Response> = {}): Response => ({ value, answeredAt: '2026-02-01T00:00:00Z', ...extra });
const Q = QUESTION_BY_ID;

describe('file versioning', () => {
  it('keeps one current version and at most five prior versions', () => {
    let f = file([]);
    for (let i = 1; i <= 8; i++) f = commitVersion(f, { versionId: `v${i}`, createdAt: '', reason: '', entries: [] });
    expect(f.current.versionId).toBe('v8');
    expect(f.history.map((v) => v.versionId)).toEqual(['v3', 'v4', 'v5', 'v6', 'v7']);
    expect(f.history).toHaveLength(MAX_HISTORY);
  });
});

describe('writing answers into notes', () => {
  it('refreshes unlocked lines and never touches human lines', () => {
    const f = file([
      entry('a', 'old M4 text', { sourceItemId: 'M4' }),
      entry('c', 'my own note', { provenance: 'human' }),
    ]);
    const res = regenerate(f, ['M4', 'M1'].map((id) => Q[id]), { M4: r(1), M1: r('talk') })!;
    const byId = Object.fromEntries(res.entries.map((e) => [e.id, e]));
    expect(byId.a.text).toBe(Q.M4.note(1));
    expect(byId.c.text).toBe('my own note');
    expect(res.entries.some((e) => e.sourceItemId === 'M1' && e.provenance === 'auto')).toBe(true);
    expect(f.current.entries[0].text).toBe('old M4 text'); // works on a copy
  });

  it('never changes a locked line: keeps it and puts the new answer on the line after it', () => {
    const entries = [entry('b', 'locked M2 text', { sourceItemId: 'M2', locked: true }), entry('x', 'other')];
    const first = applyAnswer(entries, Q.M2, r('plain'));
    expect(first.protectedIds).toEqual(['b']);
    expect(entries.map((e) => e.text)).toEqual(['locked M2 text', Q.M2.note('plain'), 'other']);
    // A second change updates the new line, not the locked one, and adds nothing.
    const second = applyAnswer(entries, Q.M2, r('soften'));
    expect(second.protectedIds).toEqual([]);
    expect(entries.map((e) => e.text)).toEqual(['locked M2 text', Q.M2.note('soften'), 'other']);
    // Clearing the answer removes the unlocked line only.
    applyAnswer(entries, Q.M2, undefined);
    expect(entries.map((e) => e.id)).toEqual(['b', 'x']);
  });

  it('puts a fresh line after a line the user edited from the same answer', () => {
    const entries = [entry('e', 'My own take on M4', { sourceItemId: 'M4', provenance: 'human' }), entry('x', 'other')];
    applyAnswer(entries, Q.M4, r(5));
    expect(entries.map((e) => e.id)[0]).toBe('e');
    expect(entries[1].sourceItemId).toBe('M4');
    expect(entries[1].provenance).toBe('auto');
  });

  it('removes the generated line when the note becomes empty (G6 "None of these")', () => {
    const entries: Entry[] = [];
    applyAnswer(entries, Q.G6, r(['money']));
    expect(entries).toHaveLength(1);
    applyAnswer(entries, Q.G6, r(['none']));
    expect(entries).toHaveLength(0);
  });

  it('appends a dated check-in line per run, and replaces it within the same run', () => {
    const entries: Entry[] = [];
    applyAnswer(entries, Q.C2, r(6), '2026-08-14T10:00:00.000Z');
    applyAnswer(entries, Q.C2, r(7), '2026-08-14T10:05:00.000Z');
    expect(entries).toHaveLength(1);
    expect(entries[0].text).toMatch(/^14 Aug 2026 — My time matched my priorities well \(7\/10\)\.$/);
    applyAnswer(entries, Q.C2, r(4), '2026-09-14T10:00:00.000Z', '2026-08-14T18:00:00.000Z');
    expect(entries).toHaveLength(2);
    expect(entries[0].text).toContain('(7/10)');
    expect(entries[1].text).toMatch(/^14 Sept? 2026 — /);
  });

  it('keeps "Add a note" text as the user’s own line under the answer', () => {
    const entries: Entry[] = [entry('z', 'unrelated')];
    applyAnswer(entries, Q.P1, r('depends', { note: 'Family wins if someone is ill.' }));
    const i = entries.findIndex((e) => e.sourceItemId === 'P1' && !e.answerNote);
    expect(entries[i + 1]).toMatchObject({ provenance: 'human', answerNote: true, text: 'In my words: Family wins if someone is ill.' });
    applyAnswer(entries, Q.P1, r('family', { note: 'Usually family.' }));
    expect(entries.filter((e) => e.answerNote)).toHaveLength(1);
    expect(entries.find((e) => e.answerNote)!.text).toBe('In my words: Usually family.');
    applyAnswer(entries, Q.P1, r('family'));
    expect(entries.filter((e) => e.answerNote)).toHaveLength(0);
  });
});

describe('summarisation', () => {
  it('keeps locked lines and the user’s own lines verbatim', () => {
    const f = sampleFiles()['moral/family-duty'];
    const kept = f.current.entries.filter((e) => e.locked || e.provenance === 'human');
    expect(kept.some((e) => e.locked)).toBe(true);
    expect(kept.some((e) => e.provenance === 'human')).toBe(true);
    const p = summarize(f, undefined)!;
    for (const l of kept) expect(p.entries.find((e) => e.id === l.id)).toEqual(l);
    expect(p.entries.filter((e) => !kept.includes(e)).every((e) => e.provenance === 'ai')).toBe(true);
  });

  it('summarises a main file from its own answers and its topic files', () => {
    const files = sampleFiles();
    const topics = Object.values(files).filter((f) => f.dir === 'worldview' && f.name !== 'main');
    const p = summarizeBranch(files['worldview/main'], topics)!;
    const lines = p.entries.filter((e) => e.provenance === 'ai' && e.kind === 'li').map((e) => e.text);
    expect(lines.some((t) => t.startsWith('Control and change:'))).toBe(true);
    expect(lines.some((t) => t.includes('choices matter more than luck'))).toBe(true);
  });
});

describe('diff', () => {
  it('reports added, removed and changed lines by entry id', () => {
    const a = { versionId: 'a', createdAt: '', reason: '', entries: [entry('1', 'x'), entry('2', 'y'), entry('3', 'z')] };
    const b = { versionId: 'b', createdAt: '', reason: '', entries: [entry('1', 'x'), entry('3', 'z2'), entry('4', 'new')] };
    expect(diffVersions(a, b).map((d) => `${d.kind}:${d.entry.id}`)).toEqual(['same:1', 'removed:2', 'changed:3', 'added:4']);
  });
});

describe('potential tensions', () => {
  it('finds cross-file tensions in the sample profile, grounded in current notes', () => {
    const ts = detectTensions(SAMPLE_RESPONSES, sampleFiles());
    expect(ts.map((t) => t.rule.id).sort()).toEqual(['clear-self-vs-far', 'family-duty-vs-work-time', 'work-first-vs-family-duty']);
    for (const t of ts) expect(t.fileIds.length).toBeGreaterThanOrEqual(2);
  });

  it('uses only the latest check-in line as evidence', () => {
    const t = detectTensions(SAMPLE_RESPONSES, sampleFiles()).find((x) => x.rule.id === 'clear-self-vs-far')!;
    expect(t.b).toHaveLength(1);
    expect(t.b[0].entry.id).toBe('cl11');
  });

  it('checks the cross-side condition of rule 3 (first priority vs where the time went)', () => {
    const files = sampleFiles();
    const resp = { ...SAMPLE_RESPONSES };
    expect(detectTensions(resp, files).map((t) => t.rule.id)).not.toContain('attention-vs-time');
    resp.C1 = { ...resp.C1, value: 'friends' };
    expect(detectTensions(resp, files).map((t) => t.rule.id)).toContain('attention-vs-time');
  });

  it('surfaces rule 4 once PC1 = take is written to the notes', () => {
    const files = sampleFiles();
    const resp = { ...SAMPLE_RESPONSES, PC1: r('take') };
    files['priorities/trade-offs'].current.entries.push(entry('pc1', Q.PC1.note('take'), { sourceItemId: 'PC1' }));
    expect(detectTensions(resp, files).map((t) => t.rule.id)).toContain('take-opportunity-vs-people-first');
  });

  it('disappears when the supporting notes are removed', () => {
    const files = sampleFiles();
    files['goals/work-and-study'].current.entries = [];
    expect(detectTensions(SAMPLE_RESPONSES, files).map((t) => t.rule.id)).not.toContain('family-duty-vs-work-time');
  });
});

describe('suggested retakes', () => {
  const now = Date.parse('2026-11-16T12:00:00Z');
  const s = suggestRetakes(SAMPLE_RESPONSES, SAMPLE_PROGRESS, sampleFiles(), now);
  const kinds = (node: string) => s.find((x) => x.nodeId === node)?.reasons.map((x) => x.kind) ?? [];

  it('lists the monthly check-in once 30 days have passed', () => {
    expect(kinds('checkin')).toContain('checkin-due');
    const fresh = suggestRetakes(SAMPLE_RESPONSES, SAMPLE_PROGRESS, sampleFiles(), Date.parse('2026-10-20T12:00:00Z'));
    expect(fresh.find((x) => x.nodeId === 'checkin')).toBeUndefined();
  });

  it('lists the upcoming event from G5, low confidence and the user’s own “shifted” note', () => {
    expect(kinds('goals')).toEqual(expect.arrayContaining(['event', 'user-reported']));
    expect(kinds('moral')).toContain('low-confidence');
  });
});

describe('then and now', () => {
  it('counts unchanged answers and lists changed ones from Response.history', () => {
    const runStart = '2026-11-01T00:00:00Z';
    const responses: Record<string, Response> = {
      P1: { value: 'family', answeredAt: '2026-11-01T10:00:00Z', history: [{ value: 'family', answeredAt: '2026-03-01T00:00:00Z' }] },
      P4: { value: 'security', answeredAt: '2026-11-01T10:00:00Z', history: [{ value: 'freedom', answeredAt: '2026-03-01T00:00:00Z' }] },
      P5: { value: ['growth'], answeredAt: '2026-11-01T10:00:00Z' },
      P3: { value: ['security'], answeredAt: '2026-03-01T00:00:00Z' },
    };
    const tn = thenAndNow(['P1', 'P3', 'P4', 'P5'].map((id) => Q[id]), responses, runStart);
    expect(tn.same.map((q) => q.id)).toEqual(['P1']);
    expect(tn.changed).toEqual([{ q: Q.P4, before: 'freedom', after: 'security' }]);
  });
});
