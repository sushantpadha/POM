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
    expect(model.parents['eth-tradeoffs'].sort()).toEqual(['eth-family', 'goal-career']);
    expect(model.parents['wv-others'].sort()).toEqual(['eth-harm', 'worldview']);
    expect(model.parents['wv-meaning'].sort()).toEqual(['goal-values', 'wv-agency']);
  });

  it('reveals only the root before onboarding, then the three branches', () => {
    expect([...availableIds(model, activeTags(model, {}, false))]).toEqual(['root']);
    const after = availableIds(model, activeTags(model, {}, true));
    expect([...after].sort()).toEqual(['ethics', 'goals', 'root', 'worldview']);
  });

  it('unlocks a node when ANY one of its parent-tags is active (OR semantics)', () => {
    // eth-tradeoffs has parent-tags [eldercare-limits, relocation]; one is enough.
    const viaCareer = availableIds(model, activeTags(model, { 'CAR-02': r(4) }, true));
    expect(viaCareer.has('eth-tradeoffs')).toBe(true);
    const viaFamily = availableIds(model, activeTags(model, { 'FAM-03': r('x') }, true));
    expect(viaFamily.has('eth-tradeoffs')).toBe(true);
    const neither = availableIds(model, activeTags(model, { 'ETH-01': r(5) }, true));
    expect(neither.has('eth-tradeoffs')).toBe(false);
  });

  it('instantiates a node once even when several parents activate it', () => {
    const tags = activeTags(model, { 'CAR-02': r(4), 'FAM-03': r('x') }, true);
    const ids = [...availableIds(model, tags)];
    expect(ids.filter((id) => id === 'eth-tradeoffs')).toHaveLength(1);
  });

  it('computes current progress over the available descendant subgraph only', () => {
    const responses = { 'ETH-01': r(5), 'ETH-02': r(4) };
    const tags = activeTags(model, responses, true);
    const m = nodeMetrics(model, 'ethics', availableIds(model, tags), responses);
    // ethics (6) + eth-harm (3) discovered via the idealism tag.
    expect(m.subAvailable).toBe(9);
    expect(m.subAnswered).toBe(2);
    expect(m.discoveredNodes).toBe(1);
    expect(m.discoveredQuestions).toBe(3);
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
