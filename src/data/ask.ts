import type { Dir } from '../types';

/**
 * Pre-written "Ask about your notes" readings for the sample profile. Citations point at
 * assessment items (resolved to the current note line for that item; for check-in items the
 * latest one) or at specific lines the user wrote. A reading is dropped if any note it cites
 * is gone.
 */
export type Ref = { qid: string } | { fileId: string; entryId: string };

export interface Interpretation {
  text: string;
  refs: Ref[];
}

export interface AskSpec {
  id: string;
  question: string;
  match: RegExp;
  /** Only offered as an example for the sample profile. */
  sampleOnly?: boolean;
  dimensions: Dir[];
  topicFiles: string[];
  /** The user's own statements to quote back. */
  reported: Ref[];
  interpretation: Interpretation[];
}

export const ASK_SPECS: AskSpec[] = [
  {
    id: 'goals-family',
    question: 'How do my goals relate to what I feel I owe my family?',
    match: /goal.*(famil|owe|duty|parent)|(famil|owe|duty|parent).*goal/i,
    dimensions: ['goals', 'moral'],
    topicFiles: ['goals/work-and-study', 'moral/family-duty'],
    reported: [{ qid: 'G1' }, { qid: 'GC5' }, { qid: 'M5' }, { qid: 'MD3' }, { fileId: 'moral/family-duty', entryId: 'fd5' }],
    interpretation: [
      {
        text: 'The friction looks like time rather than principle: you say you owe your parents or elders a lot (8/10), and that your work or study takes a lot of time away from the people close to you (7/10).',
        refs: [{ qid: 'M5' }, { qid: 'GC5' }],
      },
      {
        text: 'The limit you named, being absent for something that can’t be repeated, could be a concrete test to hold each option against.',
        refs: [{ qid: 'MD3' }],
      },
    ],
  },
  {
    id: 'zurich',
    question: 'What should I think about before deciding on the Zurich offer?',
    match: /zurich|offer|decid|move abroad|relocat/i,
    sampleOnly: true,
    dimensions: ['goals', 'moral', 'priorities'],
    topicFiles: ['goals/work-and-study', 'moral/family-duty', 'goals/relationships-and-home'],
    reported: [
      { fileId: 'goals/work-and-study', entryId: 'ws6' },
      { fileId: 'moral/family-duty', entryId: 'fd5' },
      { qid: 'GC5' },
      { fileId: 'goals/relationships-and-home', entryId: 'rh3' },
      { fileId: 'goals/main', entryId: 'gm8' },
    ],
    interpretation: [
      {
        text: 'Two dated commitments sit side by side: the offer deadline on 15 Dec 2026, and being in Pune for at least the first month after the surgery in spring 2027. It may help to check whether they actually clash.',
        refs: [{ fileId: 'goals/work-and-study', entryId: 'ws6' }, { fileId: 'moral/family-duty', entryId: 'fd5' }],
      },
      {
        text: 'You rated what work costs in time with people at 7/10. When Priorities Clash asks about this situation directly, and you have not answered it yet.',
        refs: [{ qid: 'GC5' }],
      },
      {
        text: 'You already planned to talk with your parents and look at your goals again afterwards; that conversation may change several of these notes.',
        refs: [{ fileId: 'goals/main', entryId: 'gm8' }],
      },
    ],
  },
  {
    id: 'agency-change',
    question: 'How has my view of choices and luck changed?',
    match: /agency|luck|choices|hard work|changed.*(view|belief)/i,
    sampleOnly: true,
    dimensions: ['worldview'],
    topicFiles: ['worldview/control-and-change'],
    reported: [{ qid: 'W1' }, { qid: 'W4' }, { qid: 'W5' }, { fileId: 'worldview/control-and-change', entryId: 'cc3' }],
    interpretation: [
      {
        text: 'Your agreement that your choices matter more than luck went from 5 to 4 between March and August, in the same retake where you stopped agreeing that hard work usually pays off.',
        refs: [{ qid: 'W1' }, { qid: 'W4' }],
      },
      {
        text: 'You still look at your own part first when things go wrong. That may be a habit that has outlasted the belief, rather than a contradiction.',
        refs: [{ fileId: 'worldview/control-and-change', entryId: 'cc3' }],
      },
    ],
  },
  {
    id: 'checkins',
    question: 'What do my monthly check-ins show?',
    match: /check.?in|this month|past months|lately/i,
    sampleOnly: true,
    dimensions: ['check-ins', 'priorities'],
    topicFiles: [],
    reported: [
      { fileId: 'check-ins/log', entryId: 'cl1' },
      { fileId: 'check-ins/log', entryId: 'cl5' },
      { fileId: 'check-ins/log', entryId: 'cl9' },
      { fileId: 'check-ins/log', entryId: 'cl10' },
      { fileId: 'check-ins/log', entryId: 'cl11' },
    ],
    interpretation: [
      {
        text: 'What stayed the same: in all three check-ins most of your time went to work or studies.',
        refs: [{ fileId: 'check-ins/log', entryId: 'cl1' }, { fileId: 'check-ins/log', entryId: 'cl5' }, { fileId: 'check-ins/log', entryId: 'cl9' }],
      },
      {
        text: 'What moved: how well your time matched your priorities and how close you felt to the person you want to be both went down each month, from 6 to 5 to 4.',
        refs: [
          { fileId: 'check-ins/log', entryId: 'cl2' },
          { fileId: 'check-ins/log', entryId: 'cl10' },
          { fileId: 'check-ins/log', entryId: 'cl3' },
          { fileId: 'check-ins/log', entryId: 'cl11' },
        ],
      },
    ],
  },
];

export const LOW_CONFIDENCE_QUESTION = 'Which of my notes come from answers I wasn’t sure about?';
