import type { AnswerValue, Question, Response } from '../types';

export interface Change {
  q: Question;
  before: AnswerValue;
  after: AnswerValue;
}

export interface ThenAndNow {
  /** Answered in this run and the same as the previous run's answer (incl. "Still true"). */
  same: Question[];
  /** Answered in this run and different from the previous run's answer. */
  changed: Change[];
}

const key = (v: AnswerValue) => JSON.stringify(v);

/**
 * Rule-based "then and now" for one questionnaire run, from `Response.history`:
 * compares each answer given since `runStart` with the last answer given before it.
 * Questions answered for the first time are in neither list.
 */
export function thenAndNow(questions: Question[], responses: Record<string, Response>, runStart: string): ThenAndNow {
  const out: ThenAndNow = { same: [], changed: [] };
  for (const q of questions) {
    const res = responses[q.id];
    if (!res || res.answeredAt < runStart) continue;
    const prev = [...(res.history ?? [])].reverse().find((h) => h.answeredAt < runStart);
    if (!prev) continue;
    if (key(prev.value) === key(res.value)) out.same.push(q);
    else out.changed.push({ q, before: prev.value, after: res.value });
  }
  return out;
}

/** The previous run's answer, while it has not been touched in this run. */
export function lastTime(res: Response | undefined, lastCompleted: string | undefined): AnswerValue | undefined {
  if (!res || !lastCompleted || res.answeredAt > lastCompleted) return undefined;
  return res.value;
}
