/**
 * Predefined "Ask the model" responses. Citations point at assessment items
 * (resolved to whichever current note line carries that item) or at specific
 * human-written lines. Statements are only shown when their sources still exist.
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
  /** User-reported statements to retrieve (human-written or generated from answers). */
  reported: Ref[];
  interpretation: Interpretation[];
}

export const ASK_SPECS: AskSpec[] = [
  {
    id: 'goals-ethics',
    question: 'How do my current long-term goals relate to my ethical priorities?',
    match: /goal.*(ethic|moral|value|priorit)|(ethic|moral).*goal/i,
    dimensions: ['long-term-goals', 'ethics'],
    topicFiles: ['long-term-goals/career', 'ethics/family-obligations', 'ethics/moral-principles'],
    reported: [
      { qid: 'GOL-01' },
      { qid: 'GOL-02' },
      { qid: 'ETH-01' },
      { qid: 'HRM-02' },
      { qid: 'GOL-03' },
      { qid: 'FAM-02' },
      { qid: 'FAM-03' },
    ],
    interpretation: [
      {
        text: 'Your main goal and your ethics appear to share a root in preventing harm: you describe early-detection work as helping people directly, and you treat harm to others as close to an absolute limit — including harms you fail to prevent.',
        refs: [{ qid: 'GOL-02' }, { qid: 'ETH-01' }, { qid: 'HRM-02' }],
      },
      {
        text: 'The clearest friction looks practical rather than moral: the goal now likely involves relocation, while you define your obligation to elders as being nearby and available.',
        refs: [{ qid: 'GOL-03' }, { qid: 'FAM-02' }],
      },
      {
        text: 'The limit you named yourself — not being absent for something that cannot be repeated — could serve as a concrete test when weighing specific options.',
        refs: [{ qid: 'FAM-03' }],
      },
    ],
  },
  {
    id: 'zurich',
    question: 'What should I reflect on before deciding about the Zurich offer?',
    match: /zurich|offer|decid|move abroad|relocat/i,
    sampleOnly: true,
    dimensions: ['long-term-goals', 'ethics', 'worldview'],
    topicFiles: ['long-term-goals/career', 'ethics/family-obligations', 'long-term-goals/relationships', 'worldview/personal-agency'],
    reported: [
      { fileId: 'long-term-goals/career', entryId: 'ca5' },
      { fileId: 'ethics/family-obligations', entryId: 'fo7' },
      { qid: 'CAR-02' },
      { qid: 'FAM-03' },
      { fileId: 'long-term-goals/relationships', entryId: 'rl1' },
      { fileId: 'long-term-goals/main', entryId: 'gm7' },
    ],
    interpretation: [
      {
        text: 'Two dated commitments sit side by side in your notes: the offer deadline in December and being in Pune for at least a month around your mother’s surgery in spring 2027. It may help to check whether these actually overlap before treating them as a conflict.',
        refs: [{ fileId: 'long-term-goals/career', entryId: 'ca5' }, { fileId: 'ethics/family-obligations', entryId: 'fo7' }],
      },
      {
        text: 'You said you would accept a significant move, but rated your confidence in that answer as low. The newly unlocked “Care vs Ambition Trade-offs” questionnaire asks about exactly this scenario.',
        refs: [{ qid: 'CAR-02' }],
      },
      {
        text: 'You have already planned to talk with your parents and retake your goals afterwards — that conversation may change several of the notes above.',
        refs: [{ fileId: 'long-term-goals/main', entryId: 'gm7' }],
      },
    ],
  },
  {
    id: 'worldview-change',
    question: 'How has my view of personal agency changed since I started?',
    match: /agency|changed|change.*(view|belief|worldview)|effort|luck/i,
    sampleOnly: true,
    dimensions: ['worldview'],
    topicFiles: ['worldview/personal-agency'],
    reported: [
      { qid: 'WV-01' },
      { qid: 'WV-04' },
      { qid: 'AGY-01' },
      { fileId: 'worldview/personal-agency', entryId: 'pa2' },
    ],
    interpretation: [
      {
        text: 'Your agreement that life is mostly shaped by your own effort moved from 5 to 4 between March and August, and in the same retake you described no longer believing hard work is enough.',
        refs: [{ qid: 'WV-01' }, { qid: 'WV-04' }],
      },
      {
        text: 'At the same time, when plans fail you still look first at your own part. This may be less a contradiction than a habit of self-scrutiny that has outlasted the belief behind it.',
        refs: [{ qid: 'AGY-01' }, { fileId: 'worldview/personal-agency', entryId: 'pa2' }],
      },
    ],
  },
];

export const LOW_CONFIDENCE_QUESTION = 'Which of my notes rest on low-confidence answers?';
