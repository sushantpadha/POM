/**
 * Pre-written "Ask about your notes" answers for the sample profile. Citations
 * point at assessment items (resolved to the current note line for that item) or
 * at specific lines the user wrote. A reading is dropped if any note it cites is gone.
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
  dimensions: ('ethics' | 'worldview' | 'long-term-goals')[];
  topicFiles: string[];
  /** The user's own statements to quote back. */
  reported: Ref[];
  interpretation: Interpretation[];
}

export const ASK_SPECS: AskSpec[] = [
  {
    id: 'goals-ethics',
    question: 'How do my long-term goals relate to my ethical priorities?',
    match: /goal.*(ethic|moral|value|priorit)|(ethic|moral).*goal/i,
    dimensions: ['long-term-goals', 'ethics'],
    topicFiles: ['long-term-goals/career', 'ethics/moral-principles', 'ethics/family-obligations'],
    reported: [{ qid: 'G1' }, { qid: 'MP1' }, { qid: 'E4' }, { qid: 'PP2' }, { qid: 'FR3' }],
    interpretation: [
      {
        text: 'Your project and your ethics may share a concern with preventing harm: you are working on early detection, and you treat risking harm to others as close to unacceptable.',
        refs: [{ qid: 'G1' }, { qid: 'MP1' }],
      },
      {
        text: 'The friction looks like time rather than principle: you rate what you owe your elders at 8/10, and say the project already asks you to give up a lot of family time.',
        refs: [{ qid: 'E4' }, { qid: 'PP2' }],
      },
      {
        text: 'The limit you named — not missing moments that can’t be repeated — could be a concrete test for specific options.',
        refs: [{ qid: 'FR3' }],
      },
    ],
  },
  {
    id: 'zurich',
    question: 'What should I think about before deciding on the Zurich offer?',
    match: /zurich|offer|decid|move abroad|relocat/i,
    sampleOnly: true,
    dimensions: ['long-term-goals', 'ethics'],
    topicFiles: ['long-term-goals/career', 'ethics/family-obligations', 'long-term-goals/relationships'],
    reported: [
      { fileId: 'long-term-goals/career', entryId: 'ca6' },
      { fileId: 'ethics/family-obligations', entryId: 'fo7' },
      { qid: 'PP2' },
      { fileId: 'long-term-goals/relationships', entryId: 'rl3' },
      { fileId: 'long-term-goals/main', entryId: 'gm5' },
    ],
    interpretation: [
      {
        text: 'Two dated commitments sit side by side: the offer deadline in December, and being in Pune for a month around the surgery in spring 2027. It may help to check whether they actually clash.',
        refs: [{ fileId: 'long-term-goals/career', entryId: 'ca6' }, { fileId: 'ethics/family-obligations', entryId: 'fo7' }],
      },
      {
        text: 'You rated the family time your project costs at 7/10, but with low confidence. The Care vs Ambition questions ask about this situation directly.',
        refs: [{ qid: 'PP2' }],
      },
      {
        text: 'You already planned to talk with your parents and retake your goals afterwards; that conversation may change several of these notes.',
        refs: [{ fileId: 'long-term-goals/main', entryId: 'gm5' }],
      },
    ],
  },
  {
    id: 'agency-change',
    question: 'How has my view of personal agency changed?',
    match: /agency|changed|change.*(view|belief|worldview)|effort|luck/i,
    sampleOnly: true,
    dimensions: ['worldview'],
    topicFiles: ['worldview/personal-agency'],
    reported: [{ qid: 'W1' }, { qid: 'W4' }, { fileId: 'worldview/personal-agency', entryId: 'pa3' }],
    interpretation: [
      {
        text: 'Your agreement that your choices matter more than luck went from 5 to 4 between March and August, the same retake in which you wrote that hard work is not enough.',
        refs: [{ qid: 'W1' }, { qid: 'W4' }],
      },
      {
        text: 'You still look at your own part first when things go wrong. That may be a habit that has outlasted the belief, rather than a contradiction.',
        refs: [{ fileId: 'worldview/personal-agency', entryId: 'pa3' }],
      },
    ],
  },
];

export const LOW_CONFIDENCE_QUESTION = 'Which of my notes come from answers I wasn’t sure about?';
