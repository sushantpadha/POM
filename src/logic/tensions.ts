import type { Entry, NoteFile, Response } from '../types';
import { TENSION_RULES, type TensionRule, type TensionSide } from '../data/tensions';

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
    for (const file of Object.values(files)) {
      for (const entry of file.current.entries) {
        if (entry.sourceItemId === qid) out.push({ fileId: file.id, entry, qid });
      }
    }
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
    const fileIds = [...new Set([...a, ...b].map((e) => e.fileId))];
    if (fileIds.length < 2) continue;
    out.push({ rule, a, b, fileIds });
  }
  return out;
}
