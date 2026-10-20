import type { NodeProgress, NoteFile, Response } from '../types';
import { MODEL, nodesForFile } from '../store/model';
import { daysSince, fmtDate } from './format';
import type { Tension } from './tensions';

export type RetakeReasonKind = 'user-reported' | 'flexible-age' | 'low-confidence' | 'tension';

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

const FLEXIBLE_AGE_DAYS = 120;
const CHANGE_PATTERN = /\b(retake|shifted|changed my mind|no longer true|priorities changed)\b/i;

export function suggestRetakes(
  responses: Record<string, Response>,
  progress: Record<string, NodeProgress>,
  files: Record<string, NoteFile>,
  tensions: Tension[],
  now = Date.now(),
): RetakeSuggestion[] {
  const map = new Map<string, RetakeSuggestion>();
  const add = (nodeId: string, reason: RetakeReason) => {
    const s = map.get(nodeId) ?? { nodeId, reasons: [], lastCompleted: progress[nodeId]?.completedAt };
    if (!s.reasons.some((r) => r.text === reason.text)) s.reasons.push(reason);
    map.set(nodeId, s);
  };

  // 1. User-reported changes: a human-written note that says something changed.
  for (const file of Object.values(files)) {
    for (const e of file.current.entries) {
      if (e.provenance !== 'human' || !CHANGE_PATTERN.test(e.text)) continue;
      const candidates = nodesForFile(file.id);
      const nodeId = candidates.find((id) => progress[id]?.completedAt) ?? candidates[0];
      if (!nodeId) continue;
      add(nodeId, {
        kind: 'user-reported',
        text: `You noted on ${fmtDate(e.createdAt)} that something changed: “${e.text.replace(/\[\[|\]\]|\*/g, '').slice(0, 90)}${e.text.length > 90 ? '…' : ''}”`,
        ref: { fileId: file.id, entryId: e.id },
      });
    }
  }

  for (const node of MODEL.nodes) {
    const p = progress[node.id];
    if (!p?.completedAt) continue;
    const qs = MODEL.questionsByNode[node.id];
    // 2. Flexible questions assessed a long time ago.
    const age = daysSince(p.completedAt, now);
    const flexAnswered = qs.filter((q) => q.stability === 'flexible' && responses[q.id]);
    if (age >= FLEXIBLE_AGE_DAYS && flexAnswered.length) {
      add(node.id, {
        kind: 'flexible-age',
        text: `${flexAnswered.length} flexible answer${flexAnswered.length > 1 ? 's' : ''} last assessed ${fmtDate(p.completedAt)} (${age} days ago). Flexible views are expected to change.`,
      });
    }
    // 3. Low-confidence answers.
    const low = qs.filter((q) => (responses[q.id]?.confidence ?? 5) <= 2);
    if (low.length) {
      add(node.id, {
        kind: 'low-confidence',
        text: `You gave ${low.length === 1 ? 'an answer' : `${low.length} answers`} with low confidence (${low.map((q) => q.id).join(', ')}).`,
      });
    }
  }

  // 4. Answers that feed a potential tension.
  for (const t of tensions) {
    const qids = [...t.a, ...t.b].map((e) => e.qid);
    const nodeIds = new Set(MODEL.questions.filter((q) => qids.includes(q.id)).map((q) => q.nodeId));
    for (const nodeId of nodeIds) {
      if (!progress[nodeId]?.completedAt) continue;
      add(nodeId, { kind: 'tension', text: `Feeds a potential tension: ${t.rule.title.toLowerCase()}.` });
    }
  }

  const weight: Record<RetakeReasonKind, number> = { 'user-reported': 4, 'low-confidence': 2, 'flexible-age': 2, tension: 1 };
  return [...map.values()].sort(
    (a, b) =>
      b.reasons.reduce((s, r) => s + weight[r.kind], 0) - a.reasons.reduce((s, r) => s + weight[r.kind], 0),
  );
}
