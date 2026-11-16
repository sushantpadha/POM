import { describe, expect, it } from 'vitest';
import { BRANCH_NODES, NODES } from '../data/nodes';
import { FILE_DEFS } from '../data/files';
import { QUESTIONS, QUESTION_BY_ID } from '../data/questions';
import type { GraphNode, Question, Response } from '../types';
import {
  activeTags,
  availableIds,
  buildGraphModel,
  deriveEdges,
  nodeMetrics,
  topoSort,
  visibleQuestions,
} from './graph';

const r = (value: Response['value']): Response => ({ value, answeredAt: '2026-01-01T00:00:00Z' });
const model = buildGraphModel(NODES, QUESTIONS);
const open = (responses: Record<string, Response>) => availableIds(model, activeTags(model, responses, true));

describe('question set (PLAN_V2 2.4)', () => {
  const branchOf = (q: Question) => NODES.find((n) => n.id === q.nodeId)!.branch;
  const optIn = ['GM1', 'GM2', 'GM3', 'GM4'];

  it('has 63 branch items, 4 opt-in one-liners and a 4-item check-in', () => {
    const branchItems = QUESTIONS.filter((q) => branchOf(q) !== 'root' && !optIn.includes(q.id));
    expect(branchItems).toHaveLength(63);
    expect(QUESTIONS.filter((q) => optIn.includes(q.id))).toHaveLength(4);
    expect(QUESTIONS.filter((q) => q.nodeId === 'checkin').map((q) => q.id)).toEqual(['C1', 'C2', 'C3', 'C4']);
    const perBranch = (b: string) => branchItems.filter((q) => branchOf(q) === b).length;
    expect([perBranch('priorities'), perBranch('goals'), perBranch('identity'), perBranch('worldview'), perBranch('moral')]).toEqual([10, 14, 12, 13, 14]);
  });

  it('shows only the five entry nodes on a first visit, 25 items', () => {
    const first = open({});
    expect([...first].sort()).toEqual(['root', ...BRANCH_NODES].sort());
    expect(BRANCH_NODES.reduce((s, id) => s + visibleQuestions(model, id, {}).length, 0)).toBe(25);
  });

  it('has unique ids, valid files and a note for every item', () => {
    const fileIds = new Set(FILE_DEFS.map((f) => f.id));
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const q of QUESTIONS) {
      expect(q.fileIds.length, q.id).toBeGreaterThan(0);
      for (const f of q.fileIds) expect(fileIds.has(f), `${q.id} → ${f}`).toBe(true);
      expect(q.why, `${q.id} why`).toBeTruthy();
      if (q.type === 'text') expect(q.placeholder, `${q.id} placeholder`).toBeTruthy();
      if (q.type === 'choice' || q.type === 'multi' || q.type === 'rank') expect(q.options?.length, q.id).toBeGreaterThan(1);
    }
  });

  it('writes notes that read as first-person sentences, not data', () => {
    const sample: Record<string, Response['value']> = { likert: 4, slider: 7, text: 'Something in my own words' };
    for (const q of QUESTIONS) {
      let v: Response['value'];
      if (q.type === 'choice') v = q.options![0].value;
      else if (q.type === 'multi' || q.type === 'rank') v = q.options!.slice(0, 2).map((o) => o.value);
      else if (q.type === 'project') v = { text: 'Finishing my degree', ratings: { control: 6 } };
      else v = sample[q.type];
      const note = q.note(v);
      expect(note, q.id).toMatch(/^[A-Z“]/);
      expect(note, q.id).not.toMatch(/: (Agree|Disagree|Strongly)/);
      expect(note.length, q.id).toBeLessThan(220);
    }
  });

  it('keeps carried-over wording for a few anchor items', () => {
    expect(QUESTION_BY_ID.W1.text).toBe('My own choices matter more than luck or circumstances in shaping my life.');
    expect(QUESTION_BY_ID.M4.text).toBe('What is ethical depends on the situation and culture; no rule applies everywhere.');
    expect(QUESTION_BY_ID.P1.options!.map((o) => o.label)).toEqual([
      'Partner or close relationships', 'Family', 'Work or studies', 'Where I live', 'Money', 'It depends',
    ]);
    expect(QUESTION_BY_ID.M5.askConfidence).toBe(true);
    expect(QUESTION_BY_ID.G1.sliders!.map((s) => s.value)).toEqual(['control']);
  });
});

describe('question graph', () => {
  it('is a DAG with every node reachable from the root', () => {
    expect(model.order[0]).toBe('root');
    for (const n of NODES) if (n.id !== 'root') expect(model.parents[n.id].length, n.id).toBeGreaterThan(0);
  });

  it('has the cross-branch parents from 2.3', () => {
    expect(model.parents.family.sort()).toEqual(['goals', 'moral']);
    expect(model.parents.clashes.sort()).toEqual(['career', 'family', 'priorities']);
    expect(model.parents.home.sort()).toEqual(['goals']);
    expect(model.parents.checkin).toEqual(['priorities']);
    expect(model.parents.more).toEqual(['goals']);
  });

  it('unlocks a node when ANY one of its parent-tags is active (OR semantics), once', () => {
    expect(open({ M5: r(8) }).has('family')).toBe(true);
    expect(open({ G4: r(['partner']) }).has('family')).toBe(true);
    expect(open({ M1: r('talk') }).has('family')).toBe(false);
    expect([...open({ M5: r(8), G4: r(['partner']) })].filter((id) => id === 'family')).toHaveLength(1);
    expect(open({ P1: r('family') }).has('clashes')).toBe(true);
    expect(open({ P2: r(['work']) }).has('checkin')).toBe(true);
  });

  it('opens Other Areas from G6 only for a real pick, not for "None of these"', () => {
    expect(open({ G6: r(['none']) }).has('more')).toBe(false);
    expect(open({ G6: r(['money']) }).has('more')).toBe(true);
  });

  it('hides depth-gated and opt-in follow-ups (showIf) from the runner and the counts', () => {
    const ids = (resp: Record<string, Response>, node: string) => visibleQuestions(model, node, resp).map((q) => q.id);
    expect(ids({}, 'career')).toEqual(['GC1', 'GC5']);
    expect(ids({ GC1: r('settled') }, 'career')).toEqual(['GC1', 'GC5']);
    expect(ids({ GC1: r('explore') }, 'career')).toEqual(['GC1', 'GC2', 'GC3', 'GC4', 'GC5']);
    expect(ids({ GH1: r('simple') }, 'home')).toEqual(['GH1']);
    expect(ids({ G6: r(['money', 'health']) }, 'more')).toEqual(['GM1', 'GM3']);
    const m = nodeMetrics(model, 'career', open({ G1: r({ text: 'x', ratings: {} }) }), { GC1: r('settled') });
    expect(m.ownTotal).toBe(2);
  });

  it('computes current progress over the available descendant subgraph only', () => {
    const responses = { M2: r('plain'), M5: r(8) };
    const m = nodeMetrics(model, 'moral', open(responses), responses);
    // moral (5) + Rules & Exceptions (3, via #honesty) + Family Duty (3, via #family-duty).
    expect(m.subAvailable).toBe(11);
    expect(m.subAnswered).toBe(2);
    expect(m.discoveredNodes).toBe(2);
  });
});

describe('DAG validation', () => {
  it('rejects data whose tags would create a cycle', () => {
    const nodes: GraphNode[] = [
      { id: 'root', name: 'r', tag: 'r', branch: 'root', description: '', parentTags: [] },
      { id: 'a', name: 'a', tag: 'a', branch: 'moral', description: '', parentTags: ['onboarded', 'from-b'] },
      { id: 'b', name: 'b', tag: 'b', branch: 'moral', description: '', parentTags: ['from-a'] },
    ];
    const q = (id: string, nodeId: string, tag: string) => ({ id, nodeId, selfTags: [tag] }) as unknown as Question;
    const questions = [q('A1', 'a', 'from-a'), q('B1', 'b', 'from-b')];
    const res = topoSort(['root', 'a', 'b'], deriveEdges(nodes, questions));
    expect(res.ok).toBe(false);
    expect(() => buildGraphModel(nodes, questions)).toThrow(/not a DAG/);
  });
});
