import type { AnswerValue } from '../types';

export interface TensionSide {
  /** Assessment items whose notes can evidence this side. */
  qids: string[];
  test: (v: AnswerValue) => boolean;
}

export interface TensionRule {
  id: string;
  title: string;
  /** Phrased as a possibility, never as a proven contradiction. */
  summary: string;
  a: TensionSide;
  b: TensionSide;
  /** Question tags involved — used to link to questionnaires for retaking. */
  tags: string[];
}

const atLeast = (n: number) => (v: AnswerValue) => Number(v) >= n;
const rankedFirst = (opt: string) => (v: AnswerValue) => Array.isArray(v) && v[0] === opt;
const rankedInBottom = (opt: string, k: number) => (v: AnswerValue) =>
  Array.isArray(v) && v.indexOf(opt) >= v.length - k;

export const TENSION_RULES: TensionRule[] = [
  {
    id: 'family-vs-relocation',
    title: 'Family proximity and a goal that may require moving away',
    summary:
      'Your ethics notes describe caring for ageing parents as a strong obligation, while your goals notes describe a goal that will likely involve relocating or long periods away. These may pull in different directions — or you may already have a way to hold both.',
    a: { qids: ['FAM-01', 'FAM-02'], test: (v) => Number(v) >= 4 || v === 'daily' || v === 'nearby' },
    b: { qids: ['GOL-03', 'CAR-02'], test: atLeast(4) },
    tags: ['eldercare', 'family-duty', 'relocation', 'proximity', 'tradeoff'],
  },
  {
    id: 'harm-vs-outcomes',
    title: 'Never causing harm vs. accepting small harms for better outcomes',
    summary:
      'One note treats harm to an innocent person as close to an absolute limit; another accepts small harms when they prevent larger ones. Many people hold both depending on the case — it may be worth noting where you draw the line.',
    a: { qids: ['ETH-01', 'ETH-02'], test: atLeast(4) },
    b: { qids: ['HRM-03'], test: atLeast(4) },
    tags: ['idealism', 'harm-concern', 'outcomes'],
  },
  {
    id: 'career-first-vs-family-good-life',
    title: 'Career ranked first while family is described as central to a good life',
    summary:
      'Your ten-year priorities put career first, while your family-obligations notes describe meeting those obligations as part of what makes a life good. This could reflect a timing choice rather than a conflict.',
    a: { qids: ['GOL-04'], test: rankedFirst('career') },
    b: { qids: ['FAM-04', 'ETH-05'], test: (v) => Number(v) >= 4 || v === 'family' },
    tags: ['career-goal', 'relational-goal', 'care', 'family-duty'],
  },
  {
    id: 'strangers-obligation-vs-weight',
    title: 'Obligations to strangers vs. how much strangers weigh in decisions',
    summary:
      'Your worldview notes say we have real obligations to strangers, but your ranking places strangers near the bottom of whose wellbeing weighs in major decisions. These can be consistent (a minimum duty vs. a priority) — your own note already wonders about this.',
    a: { qids: ['WV-03', 'OTH-01'], test: atLeast(4) },
    b: { qids: ['OTH-02'], test: rankedInBottom('strangers', 2) },
    tags: ['others-obligation', 'circle-of-concern'],
  },
  {
    id: 'agency-vs-luck',
    title: 'Life shaped by your own effort vs. by luck and support',
    summary:
      'A worldview note says your life is mostly shaped by your own choices, while a personal-agency note credits luck, circumstance and support with a lot. Your views on this may be shifting.',
    a: { qids: ['WV-01'], test: atLeast(4) },
    b: { qids: ['AGY-02'], test: (v) => v === 'alot' || v === 'most' },
    tags: ['agency', 'meaning'],
  },
];
