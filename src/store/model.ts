import { NODES } from '../data/nodes';
import { QUESTIONS } from '../data/questions';
import { buildGraphModel } from '../logic/graph';

/** The static question graph. Built (and DAG-validated) once at startup. */
export const MODEL = buildGraphModel(NODES, QUESTIONS);

/** Questions whose answers write to this notes file. */
export function questionsForFile(fileId: string) {
  return MODEL.questions.filter((q) => q.fileIds.includes(fileId));
}

/** Nodes that feed this file: its own node(s) plus any node with a question that writes to it. */
export function nodesForFile(fileId: string): string[] {
  const fromQuestions = new Set(questionsForFile(fileId).map((q) => q.nodeId));
  return MODEL.order.filter((id) => MODEL.nodes.find((n) => n.id === id)?.fileId === fileId || fromQuestions.has(id));
}
