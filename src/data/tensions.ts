import type { AnswerValue } from '../types';

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
  /** Question tags involved — used to link to questionnaires for retaking. */
  tags: string[];
}

const atLeast = (n: number) => (v: AnswerValue) => Number(v) >= n;
const rating = (key: string, test: (n: number) => boolean) => (v: AnswerValue) => {
  const r = v as Record<string, number> | undefined;
  return !!r && typeof r[key] === 'number' && test(r[key]);
};
const rankedFirst = (opt: string) => (v: AnswerValue) => Array.isArray(v) && v[0] === opt;

// Fixed rules over answers. A rule only shows when both sides are backed by notes
// that exist now, in two different files (see logic/tensions.ts).
export const TENSION_RULES: TensionRule[] = [
  {
    id: 'family-vs-project',
    title: 'What you owe family, and what your project costs in family time',
    summary:
      'You say you owe your elders a lot, and also that your current project asks you to give up a lot of time with family. This may be fine — or worth a closer look.',
    a: { qids: ['E4'], test: atLeast(7) },
    b: { qids: ['PP2'], test: atLeast(6) },
    tags: ['family-duty', 'project-cost', 'tradeoff'],
  },
  {
    id: 'career-first-vs-family-duty',
    title: 'Career ranked first, with a strong sense of family duty',
    summary:
      'Career comes first in your ten-year ranking, and you also say you owe your elders a lot. This can be a question of timing rather than a conflict.',
    a: { qids: ['G5'], test: rankedFirst('career') },
    b: { qids: ['E4'], test: atLeast(7) },
    tags: ['career', 'relationships', 'family-duty'],
  },
  {
    id: 'others-vs-community',
    title: 'Responsibility to people outside your circle, and low weight on community',
    summary:
      'You rate your responsibility toward people outside your family or community as high, but rate community as one of your least important aspirations. These might measure different things.',
    a: { qids: ['W3'], test: atLeast(7) },
    b: { qids: ['G3'], test: rating('community', (n) => n <= 3) },
    tags: ['obligations-to-others', 'aspirations'],
  },
  {
    id: 'opportunity-vs-relationships',
    title: 'Taking an opportunity away from family, while relationships rate highest',
    summary:
      'You would most likely take an opportunity that means seeing family much less, and close relationships are among your most important aspirations.',
    a: { qids: ['CA1'], test: (v) => v === 'take' },
    b: { qids: ['G3'], test: rating('relationships', (n) => n >= 8) },
    tags: ['tradeoff', 'aspirations', 'relationships'],
  },
];
