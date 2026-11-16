import type { NodeProgress, NoteFile, Response } from '../types';
import { MODEL, nodesForFile } from '../store/model';
import { activeTags, availableIds } from './graph';
import { daysSince, fmtDate } from './format';

export type RetakeReasonKind = 'user-reported' | 'flexible-age' | 'low-confidence' | 'checkin-due' | 'event';

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
/** The monthly check-in is suggested again this many days after the last one. */
export const CHECKIN_DAYS = 30;
export const CHECKIN_NODE = 'checkin';
/** G5: "Is there an upcoming event that could change these answers?" */
export const EVENT_QUESTION = 'G5';
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

  // 2. The monthly check-in, when it is open and due.
  const open = availableIds(MODEL, activeTags(MODEL, responses, true));
  if (open.has(CHECKIN_NODE)) {
    const last = progress[CHECKIN_NODE]?.completedAt;
    const age = last ? daysSince(last, now) : undefined;
    if (age === undefined || age >= CHECKIN_DAYS) {
      add(CHECKIN_NODE, {
        kind: 'checkin-due',
        text: age === undefined ? 'You have not done a check-in yet. It takes about a minute.' : `Your last check-in was ${age} days ago.`,
      });
    }
  }

  // 3. An upcoming event you named in Goals.
  const event = responses[EVENT_QUESTION];
  if (event && typeof event.value === 'string' && event.value.trim()) {
    let ref: RetakeReason['ref'];
    for (const file of Object.values(files)) {
      const e = file.current.entries.find((x) => x.sourceItemId === EVENT_QUESTION && !x.answerNote);
      if (e) ref = { fileId: file.id, entryId: e.id };
    }
    add('goals', {
      kind: 'event',
      text: `Upcoming event: “${event.value.trim().replace(/[.!]+$/, '')}”. Look at your goals again once it has happened.`,
      ref,
    });
  }

  for (const node of MODEL.nodes) {
    const p = progress[node.id];
    if (!p?.completedAt) continue;
    const qs = MODEL.questionsByNode[node.id];
    // 4. Flexible answers given a while ago (the check-in has its own monthly rhythm).
    const age = daysSince(p.completedAt, now);
    const flex = qs.filter((q) => q.stability === 'flexible' && responses[q.id]);
    if (node.id !== CHECKIN_NODE && age >= FLEXIBLE_AGE_DAYS && flex.length) {
      add(node.id, {
        kind: 'flexible-age',
        text: `${flex.length} flexible answer${flex.length > 1 ? 's are' : ' is'} ${age} days old.`,
      });
    }
    // 5. Answers you marked as unsure.
    const low = qs.filter((q) => (responses[q.id]?.confidence ?? 5) <= 2);
    if (low.length) {
      add(node.id, {
        kind: 'low-confidence',
        text: `You marked ${low.map((q) => q.id).join(', ')} as unsure.`,
      });
    }
  }

  const weight: Record<RetakeReasonKind, number> = { 'checkin-due': 4, 'user-reported': 3, event: 3, 'low-confidence': 2, 'flexible-age': 1 };
  return [...map.values()].sort(
    (a, b) =>
      b.reasons.reduce((s, r) => s + weight[r.kind], 0) - a.reasons.reduce((s, r) => s + weight[r.kind], 0),
  );
}
