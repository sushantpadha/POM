import { describe, expect, it } from 'vitest';
import type { Entry, NoteFile, Response } from '../types';
import { QUESTION_BY_ID } from '../data/questions';
import { sampleFiles, SAMPLE_RESPONSES } from '../data/sampleProfile';
import { commitVersion, diffVersions, generateUpdate, MAX_HISTORY, summarize, summarizeBranch } from './notes';
import { detectTensions } from './tensions';

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
  id: 'ethics/main',
  dir: 'ethics',
  name: 'main',
  title: 't',
  history: [],
  current: { versionId: 'v0', createdAt: '2026-01-01T00:00:00Z', reason: 'x', entries },
});

const r = (value: Response['value']): Response => ({ value, answeredAt: '2026-02-01T00:00:00Z' });

describe('file versioning', () => {
  it('keeps one current version and at most five prior versions', () => {
    let f = file([]);
    for (let i = 1; i <= 8; i++) {
      f = commitVersion(f, { versionId: `v${i}`, createdAt: '', reason: '', entries: [] });
    }
    expect(f.current.versionId).toBe('v8');
    expect(f.history.map((v) => v.versionId)).toEqual(['v3', 'v4', 'v5', 'v6', 'v7']);
    expect(f.history).toHaveLength(MAX_HISTORY);
  });
});

describe('generated updates', () => {
  it('refreshes unlocked lines, protects locked lines and never touches human lines', () => {
    const f = file([
      entry('a', 'old E1 text', { sourceItemId: 'E1' }),
      entry('b', 'locked E2 text', { sourceItemId: 'E2', locked: true }),
      entry('c', 'my own note', { provenance: 'human' }),
    ]);
    const qs = ['E1', 'E2', 'MP1'].map((id) => QUESTION_BY_ID[id]);
    const p = generateUpdate(f, qs, { E1: r(1), E2: r(5), MP1: r(4) }, 'test')!;
    const byId = Object.fromEntries(p.entries.map((e) => [e.id, e]));
    expect(byId.a.text).toBe(QUESTION_BY_ID['E1'].note(1));
    expect(byId.b.text).toBe('locked E2 text');
    expect(p.protectedIds).toEqual(['b']);
    expect(byId.c.text).toBe('my own note');
    expect(p.entries.some((e) => e.sourceItemId === 'MP1' && e.provenance === 'auto')).toBe(true);
    // Proposal only: the file itself is untouched until committed.
    expect(f.current.entries[0].text).toBe('old E1 text');
  });
});

describe('summarisation', () => {
  it('keeps locked lines and the user’s own lines verbatim', () => {
    const files = sampleFiles();
    const f = files['ethics/family-obligations'];
    const kept = f.current.entries.filter((e) => e.locked || e.provenance === 'human');
    expect(kept.some((e) => e.locked)).toBe(true);
    expect(kept.some((e) => e.provenance === 'human')).toBe(true);
    const p = summarize(f, undefined)!;
    for (const l of kept) expect(p.entries.find((e) => e.id === l.id)).toEqual(l);
    expect(p.entries.filter((e) => !kept.includes(e)).every((e) => e.provenance === 'ai')).toBe(true);
    expect(p.entries.length).toBeLessThan(f.current.entries.length);
  });

  it('summarises a main file from its topic files', () => {
    const files = sampleFiles();
    const topics = Object.values(files).filter((f) => f.dir === 'worldview' && f.name !== 'main');
    const p = summarizeBranch(files['worldview/main'], topics)!;
    expect(p.entries.filter((e) => e.provenance === 'ai' && e.kind === 'li').length).toBe(3);
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
    expect(ts.map((t) => t.rule.id).sort()).toEqual(
      ['career-first-vs-family-duty', 'family-vs-project', 'others-vs-community'].sort(),
    );
    for (const t of ts) expect(t.fileIds.length).toBeGreaterThanOrEqual(2);
  });

  it('disappears when the supporting notes are removed', () => {
    const files = sampleFiles();
    files['ethics/family-obligations'].current.entries = [];
    const ids = detectTensions(SAMPLE_RESPONSES, files).map((t) => t.rule.id);
    expect(ids).not.toContain('family-vs-project');
  });
});
