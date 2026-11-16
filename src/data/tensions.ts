import type { AnswerValue, Response } from '../types';

export interface TensionSide {
  /** Assessment items whose notes can evidence this side. */
  qids: string[];
  test: (v: AnswerValue) => boolean;
}

export interface TensionRule {
  id: string;
  title: string;
  /** Phrased as a possibility, never as a contradiction. */
  summary: string;
  a: TensionSide;
  b: TensionSide;
  /** Optional condition across both sides (e.g. "P2's first area differs from C1"). */
  both?: (responses: Record<string, Response>) => boolean;
  /** Question tags involved — used to link to questionnaires for retaking. */
  tags: string[];
}

const atLeast = (n: number) => (v: AnswerValue) => Number(v) >= n;
const atMost = (n: number) => (v: AnswerValue) => Number(v) <= n;
const equals = (...opts: string[]) => (v: AnswerValue) => opts.includes(String(v));
const includes = (opt: string) => (v: AnswerValue) => Array.isArray(v) && v.includes(opt);
const rankedFirst = (opt: string) => (v: AnswerValue) => Array.isArray(v) && v[0] === opt;
const answered = () => true;

// Fixed rules over answers (PLAN_V2.md 2.5). A rule only shows when both sides are backed by
// notes that exist now, in two different files (see logic/tensions.ts). For check-in items
// only the latest check-in counts.
export const TENSION_RULES: TensionRule[] = [
  {
    id: 'family-duty-vs-work-time',
    title: 'What you owe family, and what work costs in time with them',
    summary: 'You say you owe your parents or elders a lot, and that your work or study takes a lot of time away from the people close to you. This may be fine for now, or worth a closer look.',
    a: { qids: ['M5'], test: atLeast(7) },
    b: { qids: ['GC5'], test: atLeast(6) },
    tags: ['family-duty', 'work-cost'],
  },
  {
    id: 'work-first-vs-family-duty',
    title: 'Work or studies ranked first, with a strong sense of family duty',
    summary: 'Work or studies comes first in the attention you want to give over the next few years, and you also say you owe your parents or elders a lot. This can be a question of timing rather than a conflict.',
    a: { qids: ['P2'], test: rankedFirst('work') },
    b: { qids: ['M5'], test: atLeast(7) },
    tags: ['life-areas', 'family-duty'],
  },
  {
    id: 'attention-vs-time',
    title: 'Where you want your attention, and where the time went',
    summary: 'The area you ranked first for the next few years is not the one that got most of your time in your latest check-in. One month may not say much; a pattern might.',
    a: { qids: ['P2'], test: answered },
    b: { qids: ['C1'], test: answered },
    both: (r) => Array.isArray(r.P2?.value) && r.C1 !== undefined && (r.P2.value as string[])[0] !== r.C1.value,
    tags: ['life-areas', 'checkin'],
  },
  {
    id: 'take-opportunity-vs-people-first',
    title: 'Taking an opportunity away from family, while people usually win',
    summary: 'You would most likely take an opportunity that means seeing your family much less, and you also say family or close relationships usually win when things clash.',
    a: { qids: ['PC1'], test: equals('take') },
    b: { qids: ['P1'], test: equals('family', 'partner') },
    tags: ['tradeoff', 'priority'],
  },
  {
    id: 'partner-first-vs-opportunities',
    title: 'Close relationships usually win, yet you would rather be where the opportunities are',
    summary: 'You say a partner or close relationships usually win a clash, and also that you would rather be where the best opportunities are than near the people you love.',
    a: { qids: ['P1'], test: equals('partner') },
    b: { qids: ['PT3'], test: equals('opportunities') },
    tags: ['priority', 'trade'],
  },
  {
    id: 'security-vs-open-life',
    title: 'Security matters most, and you would rather have an open, changing life',
    summary: 'Security is one of the things that matter most to you, and you would also rather have an open, changing life than a stable one. Both can be true in different parts of life.',
    a: { qids: ['P3'], test: includes('security') },
    b: { qids: ['PT2'], test: equals('open') },
    tags: ['values', 'trade'],
  },
  {
    id: 'choices-vs-luck',
    title: 'Choices matter more than luck, yet a recent success went to luck',
    summary: 'You agree that your own choices matter more than luck, and you credited something that went well recently mostly to luck or help. One example may not say much.',
    a: { qids: ['W1'], test: atLeast(4) },
    b: { qids: ['WC3'], test: atMost(3) },
    tags: ['agency', 'agency-belief'],
  },
  {
    id: 'clear-self-vs-far',
    title: 'A clear sense of who you are, and far from who you want to be',
    summary: 'You say you have a clear sense of who you are, and in your latest check-in you felt far from the person you want to be. Knowing yourself and being where you want to be are different things.',
    a: { qids: ['I4'], test: atLeast(4) },
    b: { qids: ['C3'], test: atMost(4) },
    tags: ['clarity', 'checkin'],
  },
];
