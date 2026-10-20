import type { GraphNode, NodeProgress, Question, Response } from '../types';
import { ONBOARDED_TAG, ROOT_ID } from '../data/nodes';

export interface Edge {
  from: string;
  to: string;
  /** Tags that connect the two nodes (from's question self-tags ∩ to's parent-tags). */
  tags: string[];
}

export type NodeStatus = 'locked' | 'available' | 'in-progress' | 'answered';

/**
 * Edges are derived, never hand-written: P → C whenever a question in P emits a
 * tag that appears in C's parent-tags. Because nodes are keyed by id, a node
 * reachable from several parents is still instantiated exactly once.
 */
export function deriveEdges(nodes: GraphNode[], questions: Question[]): Edge[] {
  const edges = new Map<string, Edge>();
  for (const child of nodes) {
    for (const tag of child.parentTags) {
      // The root's onboarding step emits the "onboarded" tag.
      const emitters =
        tag === ONBOARDED_TAG
          ? [ROOT_ID]
          : questions.filter((q) => q.selfTags.includes(tag)).map((q) => q.nodeId);
      for (const from of emitters) {
        if (from === child.id) continue; // a node never unlocks itself
        const key = `${from}->${child.id}`;
        const e = edges.get(key) ?? { from, to: child.id, tags: [] };
        if (!e.tags.includes(tag)) e.tags.push(tag);
        edges.set(key, e);
      }
    }
  }
  return [...edges.values()];
}

/** Kahn's algorithm. Returns a topological order, or the nodes left in a cycle. */
export function topoSort(
  nodeIds: string[],
  edges: Edge[],
): { ok: true; order: string[] } | { ok: false; cycle: string[] } {
  const indeg = new Map(nodeIds.map((id) => [id, 0]));
  const out = new Map<string, string[]>(nodeIds.map((id) => [id, []]));
  for (const e of edges) {
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
    out.get(e.from)?.push(e.to);
  }
  const queue = nodeIds.filter((id) => indeg.get(id) === 0);
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const to of out.get(id) ?? []) {
      indeg.set(to, indeg.get(to)! - 1);
      if (indeg.get(to) === 0) queue.push(to);
    }
  }
  if (order.length === nodeIds.length) return { ok: true, order };
  return { ok: false, cycle: nodeIds.filter((id) => !order.includes(id)) };
}

export interface GraphModel {
  nodes: GraphNode[];
  questions: Question[];
  edges: Edge[];
  order: string[];
  /** Longest forward path from the root — used for radial layout rings. */
  depth: Record<string, number>;
  children: Record<string, string[]>;
  parents: Record<string, string[]>;
  questionsByNode: Record<string, Question[]>;
}

export function buildGraphModel(nodes: GraphNode[], questions: Question[]): GraphModel {
  const edges = deriveEdges(nodes, questions);
  const sorted = topoSort(
    nodes.map((n) => n.id),
    edges,
  );
  if (!sorted.ok) {
    throw new Error(`Question graph is not a DAG; cycle among: ${sorted.cycle.join(', ')}`);
  }
  const children: Record<string, string[]> = {};
  const parents: Record<string, string[]> = {};
  for (const n of nodes) {
    children[n.id] = [];
    parents[n.id] = [];
  }
  for (const e of edges) {
    children[e.from].push(e.to);
    parents[e.to].push(e.from);
  }
  const depth: Record<string, number> = {};
  for (const id of sorted.order) {
    depth[id] = parents[id].length ? Math.max(...parents[id].map((p) => depth[p] + 1)) : 0;
  }
  const questionsByNode: Record<string, Question[]> = {};
  for (const n of nodes) questionsByNode[n.id] = questions.filter((q) => q.nodeId === n.id);
  return { nodes, questions, edges, order: sorted.order, depth, children, parents, questionsByNode };
}

/** A question counts as answered once a response exists (skipped questions are simply absent). */
export function activeTags(
  model: GraphModel,
  responses: Record<string, Response>,
  onboarded: boolean,
): Set<string> {
  const tags = new Set<string>();
  if (onboarded) tags.add(ONBOARDED_TAG);
  for (const q of model.questions) {
    if (responses[q.id]) q.selfTags.forEach((t) => tags.add(t));
  }
  return tags;
}

/** OR semantics: any matching parent-tag is sufficient. */
export function isAvailable(node: GraphNode, tags: Set<string>): boolean {
  if (node.id === ROOT_ID) return true;
  return node.parentTags.some((t) => tags.has(t));
}

export function availableIds(model: GraphModel, tags: Set<string>): Set<string> {
  return new Set(model.nodes.filter((n) => isAvailable(n, tags)).map((n) => n.id));
}

export function descendants(model: GraphModel, id: string): Set<string> {
  const seen = new Set<string>();
  const stack = [...model.children[id]];
  while (stack.length) {
    const c = stack.pop()!;
    if (seen.has(c)) continue;
    seen.add(c);
    stack.push(...model.children[c]);
  }
  return seen;
}

export function nodeStatus(
  model: GraphModel,
  id: string,
  available: Set<string>,
  responses: Record<string, Response>,
  progress: Record<string, NodeProgress>,
  onboarded: boolean,
): NodeStatus {
  if (id === ROOT_ID) return onboarded ? 'answered' : 'available';
  if (!available.has(id)) return 'locked';
  if (progress[id]?.completedAt) return 'answered';
  if (model.questionsByNode[id].some((q) => responses[q.id])) return 'in-progress';
  return 'available';
}

export interface NodeMetrics {
  /** Answered questions in this node only. */
  ownAnswered: number;
  ownTotal: number;
  /** Current progress: answered / currently available questions in the node's descendant subgraph (incl. itself). */
  subAnswered: number;
  subAvailable: number;
  /** Exploration: descendants (and their questions) discovered through answers. */
  discoveredNodes: number;
  discoveredQuestions: number;
  /** Descendants that exist but are still undiscovered. Never shown as "missing" progress. */
  undiscoveredNodes: number;
}

export function nodeMetrics(
  model: GraphModel,
  id: string,
  available: Set<string>,
  responses: Record<string, Response>,
): NodeMetrics {
  const own = model.questionsByNode[id];
  const desc = [...descendants(model, id)];
  const discovered = desc.filter((d) => available.has(d));
  const subgraph = [id, ...discovered];
  const subQs = subgraph.flatMap((n) => model.questionsByNode[n]);
  return {
    ownAnswered: own.filter((q) => responses[q.id]).length,
    ownTotal: own.length,
    subAnswered: subQs.filter((q) => responses[q.id]).length,
    subAvailable: subQs.length,
    discoveredNodes: discovered.length,
    discoveredQuestions: discovered.reduce((s, n) => s + model.questionsByNode[n].length, 0),
    undiscoveredNodes: desc.length - discovered.length,
  };
}

/** The starting map (root + three branches) is not counted as exploration. */
export const BASE_NODES = ['root', 'ethics', 'worldview', 'goals'];

export function globalExploration(model: GraphModel, available: Set<string>) {
  const extra = [...available].filter((id) => !BASE_NODES.includes(id));
  return {
    nodes: extra.length,
    questions: extra.reduce((s, id) => s + model.questionsByNode[id].length, 0),
  };
}

/** Nodes whose parent-tags include `tag` — what answering a tagged question can reveal. */
export function nodesUnlockedByTag(model: GraphModel, tag: string): string[] {
  return model.nodes.filter((n) => n.parentTags.includes(tag)).map((n) => n.id);
}

/** Nodes that contain at least one question carrying any of the given tags. */
export function nodesWithQuestionTags(model: GraphModel, tags: string[]): string[] {
  const ids = new Set<string>();
  for (const q of model.questions) {
    if (q.selfTags.some((t) => tags.includes(t))) ids.add(q.nodeId);
  }
  return model.order.filter((id) => ids.has(id));
}
