import { NODES } from '../data/nodes';
import { QUESTIONS } from '../data/questions';
import { buildGraphModel } from '../logic/graph';

/** The static question graph. Built (and DAG-validated) once at startup. */
export const MODEL = buildGraphModel(NODES, QUESTIONS);

export function nodesForFile(fileId: string): string[] {
  return MODEL.nodes.filter((n) => n.fileId === fileId).map((n) => n.id);
}

export function questionsForFile(fileId: string) {
  const nodeIds = nodesForFile(fileId);
  return MODEL.questions.filter((q) => nodeIds.includes(q.nodeId));
}
