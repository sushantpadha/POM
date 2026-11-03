import { describe, expect, it } from 'vitest';
import { NODES } from '../data/nodes';
import { QUESTIONS } from '../data/questions';
import type { GraphNode, Question, Response } from '../types';
import {
  activeTags,
  availableIds,
  buildGraphModel,
  deriveEdges,
  nodeMetrics,
  topoSort,
} from './graph';

const r = (value: Response['value']): Response => ({ value, answeredAt: '2026-01-01T00:00:00Z' });

describe('sample question graph', () => {
  const model = buildGraphModel(NODES, QUESTIONS);

  it('is a DAG with every node reachable from the root', () => {
    expect(model.order[0]).toBe('root');
    for (const n of NODES) {
      if (n.id !== 'root') expect(model.parents[n.id].length).toBeGreaterThan(0);
    }
  });

  it('has nodes with multiple parents (DAG, not a tree)', () => {
    // Doc 2: Family Relationships is opened by E4 (Ethics) and by G4 (Long-term Goals).
    expect(model.parents['family'].sort()).toEqual(['ethics', 'goals']);
    expect(model.parents['meaning'].sort()).toEqual(['aspirations', 'worldview']);
    expect(model.parents['tradeoffs'].sort()).toEqual(['family', 'projects']);
  });

  it('reveals only the root before onboarding, then the three branches', () => {
    expect([...availableIds(model, activeTags(model, {}, false))]).toEqual(['root']);
    const after = availableIds(model, activeTags(model, {}, true));
    expect([...after].sort()).toEqual(['ethics', 'goals', 'root', 'worldview']);
  });

  it('unlocks a node when ANY one of its parent-tags is active (OR semantics)', () => {
    const viaEthics = availableIds(model, activeTags(model, { E4: r(8) }, true));
    expect(viaEthics.has('family')).toBe(true);
    const viaGoals = availableIds(model, activeTags(model, { G4: r('x') }, true));
    expect(viaGoals.has('family')).toBe(true);
    const neither = availableIds(model, activeTags(model, { E1: r(5) }, true));
    expect(neither.has('family')).toBe(false);
  });

  it('instantiates a node once even when several parents activate it', () => {
    const tags = activeTags(model, { E4: r(8), G4: r('x') }, true);
    const ids = [...availableIds(model, tags)];
    expect(ids.filter((id) => id === 'family')).toHaveLength(1);
  });

  it('computes current progress over the available descendant subgraph only', () => {
    const responses = { E1: r(4), E2: r(3) };
    const tags = activeTags(model, responses, true);
    const m = nodeMetrics(model, 'ethics', availableIds(model, tags), responses);
    // ethics (5) + Moral Principles (4), opened by #idealism / #relativism.
    expect(m.subAvailable).toBe(9);
    expect(m.subAnswered).toBe(2);
    expect(m.discoveredNodes).toBe(1);
    expect(m.discoveredQuestions).toBe(4);
  });
});

describe('writeup items', () => {
  it('contains every item from Doc 2 with its stated tag, type and file', () => {
    const q = (id: string) => QUESTIONS.find((x) => x.id === id)!;
    for (const id of ['E1', 'E2', 'E3', 'E4', 'E5', 'W1', 'W2', 'W3', 'W4', 'W5', 'G1', 'G2', 'G3', 'G4', 'G5']) expect(q(id)).toBeDefined();
    expect(q('E4').selfTags).toContain('family-duty');
    expect(q('E4').fileIds).toEqual(['ethics/family-obligations']);
    expect(q('W1').fileIds).toEqual(['worldview/personal-agency']);
    expect(q('W2').fileIds).toEqual(['worldview/sources-of-knowledge']);
    expect(q('W3').fileIds).toEqual(['worldview/obligations-to-others']);
    expect(q('G2').fileIds.sort()).toEqual(['long-term-goals/career', 'long-term-goals/relationships']);
    expect(q('G3').stability).toBe('stable');
    expect(q('G4').selfTags).toContain('relationships');
  });
});

describe('DAG validation', () => {
  it('rejects data whose tags would create a cycle', () => {
    const nodes: GraphNode[] = [
      { id: 'root', name: 'r', tag: 'r', branch: 'root', description: '', parentTags: [] },
      { id: 'a', name: 'a', tag: 'a', branch: 'ethics', description: '', parentTags: ['onboarded', 'from-b'] },
      { id: 'b', name: 'b', tag: 'b', branch: 'ethics', description: '', parentTags: ['from-a'] },
    ];
    const q = (id: string, nodeId: string, tag: string) =>
      ({ id, nodeId, selfTags: [tag] }) as unknown as Question;
    const questions = [q('A1', 'a', 'from-a'), q('B1', 'b', 'from-b')];
    const res = topoSort(['root', 'a', 'b'], deriveEdges(nodes, questions));
    expect(res.ok).toBe(false);
    expect(() => buildGraphModel(nodes, questions)).toThrow(/not a DAG/);
  });
});
