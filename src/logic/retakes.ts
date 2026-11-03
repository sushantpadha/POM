import type { NodeProgress, NoteFile, Response } from '../types';
import { MODEL, nodesForFile } from '../store/model';
import { daysSince, fmtDate } from './format';

export type RetakeReasonKind = 'user-reported' | 'flexible-age' | 'low-confidence';

export interface RetakeReason {
  kind: RetakeReasonKind;
  text: string;
  ref?: { fileId: string; entryId: string };
}

export interface RetakeSuggestion {
  nodeId: string;
  reasons: RetakeReason[];
  lastCompleted?: string;
}

/** Flexible answers older than this are suggested for a retake. */
export const FLEXIBLE_AGE_DAYS = 120;
const CHANGE_PATTERN = /\b(retake|shifted|changed my mind|no longer true|priorities changed)\b/i;

export function suggestRetakes(
  responses: Record<string, Response>,
  progress: Record<string, NodeProgress>,
  files: Record<string, NoteFile>,
  now = Date.now(),
): RetakeSuggestion[] {
  const map = new Map<string, RetakeSuggestion>();
  const add = (nodeId: string, reason: RetakeReason) => {
    const s = map.get(nodeId) ?? { nodeId, reasons: [], lastCompleted: progress[nodeId]?.completedAt };
    if (!s.reasons.some((r) => r.text === reason.text)) s.reasons.push(reason);
    map.set(nodeId, s);
  };

  // 1. You wrote a note saying something changed.
  for (const file of Object.values(files)) {
    for (const e of file.current.entries) {
      if (e.provenance !== 'human' || !CHANGE_PATTERN.test(e.text)) continue;
      const candidates = nodesForFile(file.id);
      const nodeId = candidates.find((id) => progress[id]?.completedAt) ?? candidates[0];
      if (!nodeId) continue;
      add(nodeId, {
        kind: 'user-reported',
        text: `Your note from ${fmtDate(e.createdAt)} says something changed.`,
        ref: { fileId: file.id, entryId: e.id },
      });
    }
  }

  for (const node of MODEL.nodes) {
    const p = progress[node.id];
    if (!p?.completedAt) continue;
    const qs = MODEL.questionsByNode[node.id];
    // 2. Flexible answers given a while ago.
    const age = daysSince(p.completedAt, now);
    const flex = qs.filter((q) => q.stability === 'flexible' && responses[q.id]);
    if (age >= FLEXIBLE_AGE_DAYS && flex.length) {
      add(node.id, {
        kind: 'flexible-age',
        text: `${flex.length} flexible answer${flex.length > 1 ? 's are' : ' is'} ${age} days old.`,
      });
    }
    // 3. Answers you marked as unsure.
    const low = qs.filter((q) => (responses[q.id]?.confidence ?? 5) <= 2);
    if (low.length) {
      add(node.id, {
        kind: 'low-confidence',
        text: `You marked ${low.map((q) => q.id).join(', ')} as unsure.`,
      });
    }
  }

  const weight: Record<RetakeReasonKind, number> = { 'user-reported': 3, 'low-confidence': 2, 'flexible-age': 1 };
  return [...map.values()].sort(
    (a, b) =>
      b.reasons.reduce((s, r) => s + weight[r.kind], 0) - a.reasons.reduce((s, r) => s + weight[r.kind], 0),
  );
}
