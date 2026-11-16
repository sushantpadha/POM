import type { Entry, NoteFile, Response } from '../types';
import { TENSION_RULES, type TensionRule, type TensionSide } from '../data/tensions';
import { QUESTION_BY_ID } from '../data/questions';

export interface Evidence {
  fileId: string;
  entry: Entry;
  qid: string;
}

export interface Tension {
  rule: TensionRule;
  a: Evidence[];
  b: Evidence[];
  fileIds: string[];
}

function evidenceFor(
  side: TensionSide,
  responses: Record<string, Response>,
  files: Record<string, NoteFile>,
): Evidence[] {
  const out: Evidence[] = [];
  for (const qid of side.qids) {
    const res = responses[qid];
    if (!res || !side.test(res.value)) continue;
    const lines: Evidence[] = [];
    for (const file of Object.values(files)) {
      for (const entry of file.current.entries) {
        if (entry.sourceItemId === qid && !entry.answerNote) lines.push({ fileId: file.id, entry, qid });
      }
    }
    // A check-in item keeps one line per month: only the latest one is current.
    if (QUESTION_BY_ID[qid]?.log) {
      const latest = lines.sort((x, y) => x.entry.createdAt.localeCompare(y.entry.createdAt)).pop();
      if (latest) out.push(latest);
    } else out.push(...lines);
  }
  return out;
}

/**
 * Compares the *current* versions of related files. A potential tension is
 * reported only when both sides are grounded in notes that exist right now,
 * across at least two different files.
 */
export function detectTensions(
  responses: Record<string, Response>,
  files: Record<string, NoteFile>,
): Tension[] {
  const out: Tension[] = [];
  for (const rule of TENSION_RULES) {
    const a = evidenceFor(rule.a, responses, files);
    const b = evidenceFor(rule.b, responses, files);
    if (!a.length || !b.length) continue;
    if (rule.both && !rule.both(responses)) continue;
    const fileIds = [...new Set([...a, ...b].map((e) => e.fileId))];
    if (fileIds.length < 2) continue;
    out.push({ rule, a, b, fileIds });
  }
  return out;
}
