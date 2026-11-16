// Sample profile: "Priya", a 24-year-old MSc student in computational biology in Pune who
// started using the app in March 2026 and has an offer for a three-year PhD position in
// Zurich (deadline 15 Dec 2026). Notes are in the first person. Fictional data.
//
// Generated lines are built with each question's own note() so they read exactly as the app
// would write them. Lines Priya wrote herself, summary lines and locks are added by hand.
import type { AnswerValue, Entry, FileVersion, NodeProgress, NoteFile, Provenance, Response } from '../types';
import { FILE_DEFS } from './files';
import { QUESTION_BY_ID } from './questions';
import { logDate } from '../logic/notes';

const at = (date: string, time = '10:00') => `${date}T${time}:00.000Z`;

// ── Answers ───────────────────────────────────────────────────

type Hist = NonNullable<Response['history']>;
const h = (value: AnswerValue, date: string, confidence?: number): Hist[number] => ({ value, answeredAt: at(date), confidence });
const r = (value: AnswerValue, date: string, opts: { confidence?: number; history?: Hist; note?: string } = {}): Response => ({
  value,
  answeredAt: at(date),
  confidence: opts.confidence,
  history: opts.history,
  note: opts.note,
});

const P2_MARCH = ['family', 'work', 'health', 'partner', 'friends', 'learning'];
const THESIS = 'Finishing my MSc thesis on early cancer detection from blood samples';

export const SAMPLE_RESPONSES: Record<string, Response> = {
  // Personal Priorities (March, retaken in September)
  P1: r('family', '2026-09-12', { history: [h('family', '2026-03-14')] }),
  P2: r(['work', 'family', 'health', 'friends', 'partner', 'learning'], '2026-09-12', { history: [h(P2_MARCH, '2026-03-14')] }),
  P3: r(['autonomy', 'relationships', 'achievement'], '2026-09-12', { history: [h(['autonomy', 'relationships', 'achievement'], '2026-03-14')] }),
  P4: r('freedom', '2026-03-14'),
  P5: r(['problems', 'impact'], '2026-03-14'),
  PT1: r('time', '2026-03-15'),
  PT2: r('stable', '2026-03-15'),
  PT3: r('near', '2026-03-15'),
  // Worldview (March, retaken in August)
  W1: r(4, '2026-08-02', { history: [h(5, '2026-03-16')] }),
  W2: r(4, '2026-03-16'),
  W3: r(4, '2026-03-16'),
  W4: r(2, '2026-08-02', { history: [h(4, '2026-03-16')] }),
  W5: r('I used to think hard work was enough. Watching friends put in the same effort and end up in very different places changed that.', '2026-08-02'),
  WC1: r('internal', '2026-10-11'),
  WC3: r(4, '2026-10-11'),
  // Moral Principles
  M1: r('talk', '2026-03-20'),
  M2: r('soften', '2026-03-20'),
  M3: r('outcome', '2026-03-20'),
  M4: r(3, '2026-03-20'),
  M5: r(8, '2026-03-20', { confidence: 1 }),
  MR1: r(2, '2026-03-25'),
  MR2: r('yes', '2026-03-25'),
  MR3: r('Take credit for someone else’s work.', '2026-03-25'),
  MD1: r('gratitude', '2026-04-10', { note: 'Gratitude, but love too; it is hard to separate them.' }),
  MD2: r(2, '2026-04-10'),
  MD3: r('It doesn’t require giving up my career, but it does require being reachable and back for the big moments. The line is being absent for something that can’t be repeated.', '2026-04-10'),
  // Identity
  I1: r('Curious, stubborn, loyal', '2026-04-02'),
  I2: r(['curiosity', 'persistence', 'honesty'], '2026-04-02'),
  I3: r(['student', 'child', 'friend'], '2026-04-02'),
  I4: r(4, '2026-04-02'),
  IT1: r(2, '2026-04-05'),
  IT2: r(4, '2026-04-05'),
  IT3: r(4, '2026-04-05'),
  IT4: r(4, '2026-04-05'),
  IT5: r(4, '2026-04-05'),
  // Goals (May, retaken in September)
  G1: r({ text: THESIS, ratings: { control: 6 } }, '2026-09-12', { history: [h({ text: THESIS, ratings: { control: 7 } }, '2026-05-18')] }),
  G2: r('A lab with a small team building open diagnostic tools, home for dinner, and a weekend train back to Pune once a month.', '2026-05-18'),
  G3: r('narrowing', '2026-05-18'),
  G4: r(['partner', 'near-parents', 'friends', 'abroad'], '2026-05-18'),
  G5: r('The Zurich PhD offer: I have to answer by 15 Dec 2026.', '2026-09-12'),
  G6: r(['parents'], '2026-05-18'),
  GM2: r('Be in Pune for the big moments, and move back if one of them needs daily care.', '2026-06-20'),
  GC1: r('explore', '2026-09-14'),
  GC2: r('Zurich PhD in diagnostics — active\nIndustry diagnostics job in Bengaluru — interested\nTeaching — untried', '2026-09-14'),
  GC3: r('The Zurich lab is the best fit for the detection work, and I would regret not trying.', '2026-09-14'),
  GC4: r('A month of contract work at a diagnostics start-up over the winter break.', '2026-09-14'),
  GC5: r(7, '2026-09-14'),
  GH1: r('explore', '2026-06-20'),
  GH2: r('A few years abroad, then somewhere within a day’s travel of Pune.', '2026-06-20'),
  // Monthly check-ins: August, September, October
  C1: r('work', '2026-10-14', { history: [h('work', '2026-08-14'), h('work', '2026-09-14')] }),
  C2: r(4, '2026-10-14', { history: [h(6, '2026-08-14'), h(5, '2026-09-14')] }),
  C3: r(4, '2026-10-14', { history: [h(6, '2026-08-14'), h(5, '2026-09-14')] }),
  C4: r('Told Aai and Baba about Zurich. Baba went quiet.', '2026-10-14', {
    history: [h('Thesis deadline moved up; skipped two weekend calls home.', '2026-08-14'), h('Got the Zurich offer.', '2026-09-14')],
  }),
};

// ── Lines ─────────────────────────────────────────────────────

/** A generated line, worded by the question's own note(). */
function a(id: string, qid: string, value: AnswerValue, created: string, opts: { updated?: string; locked?: boolean } = {}): Entry {
  const q = QUESTION_BY_ID[qid];
  const text = q.log ? `${logDate(at(created))} — ${q.note(value)}` : q.note(value);
  return line(id, q.type === 'text' ? 'quote' : 'li', text, 'auto', created, { ...opts, src: qid });
}

function line(
  id: string,
  kind: Entry['kind'],
  text: string,
  provenance: Provenance,
  created: string,
  opts: { updated?: string; src?: string; locked?: boolean; answerNote?: boolean } = {},
): Entry {
  return {
    id,
    kind,
    text,
    provenance,
    createdAt: at(created),
    updatedAt: at(opts.updated ?? created),
    sourceItemId: opts.src,
    answerNote: opts.answerNote,
    locked: opts.locked ?? false,
  };
}
const human = (id: string, text: string, created: string, opts: { updated?: string; src?: string; locked?: boolean } = {}) =>
  line(id, 'li', text, 'human', created, opts);
const ai = (id: string, text: string, created: string, src?: string) => line(id, 'li', text, 'ai', created, { src });

const v = (id: string, date: string, reason: string, entries: Entry[]): FileVersion => ({
  versionId: id,
  createdAt: at(date, '18:30'),
  reason,
  entries,
});
const locked = (x: Entry, date: string): Entry => ({ ...x, locked: true, updatedAt: at(date) });
const edited = (x: Entry, text: string, date: string): Entry => ({ ...x, text, updatedAt: at(date) });
const R = SAMPLE_RESPONSES;
const hv = (qid: string, i = 0) => R[qid].history![i].value;

// check-ins/log
const c1a = a('cl1', 'C1', hv('C1'), '2026-08-14');
const c2a = a('cl2', 'C2', hv('C2'), '2026-08-14');
const c3a = a('cl3', 'C3', hv('C3'), '2026-08-14');
const c4a = a('cl4', 'C4', hv('C4'), '2026-08-14');
const c1b = a('cl5', 'C1', hv('C1', 1), '2026-09-14');
const c2b = a('cl6', 'C2', hv('C2', 1), '2026-09-14');
const c3b = a('cl7', 'C3', hv('C3', 1), '2026-09-14');
const c4b = a('cl8', 'C4', hv('C4', 1), '2026-09-14');
const c1c = a('cl9', 'C1', R.C1.value, '2026-10-14');
const c2c = a('cl10', 'C2', R.C2.value, '2026-10-14');
const c3c = a('cl11', 'C3', R.C3.value, '2026-10-14');
const c4c = a('cl12', 'C4', R.C4.value, '2026-10-14');
const clh = human('cl13', 'Three months running, most of my time went to the thesis.', '2026-10-15');

// worldview/main
const w1a = a('wm1', 'W1', hv('W1'), '2026-03-16');
const w1b = edited({ ...w1a }, QUESTION_BY_ID.W1.note(R.W1.value), '2026-08-02');
const w2 = a('wm2', 'W2', R.W2.value, '2026-03-16');
const w3 = a('wm3', 'W3', R.W3.value, '2026-03-16');
const w4a = a('wm4', 'W4', hv('W4'), '2026-03-16');
const w4b = edited({ ...w4a }, QUESTION_BY_ID.W4.note(R.W4.value), '2026-08-02');
const wmh = human('wm5', 'These are prompts for reflection, not a personality result.', '2026-03-18');
const w5 = a('wm6', 'W5', R.W5.value, '2026-08-02');
const wmai = ai('wm7', 'Still sees own choices as the main driver, but less firmly than in March (5 → 4), and no longer agrees that hard work usually pays off.', '2026-08-03', 'W1');

// worldview/control-and-change
const wc1 = a('cc1', 'WC1', R.WC1.value, '2026-10-11');
const wc3 = a('cc2', 'WC3', R.WC3.value, '2026-10-11');
const cch = human('cc3', 'Honestly: I blame myself first and only notice the circumstances later.', '2026-10-11');

// moral/main
const m1 = a('mm1', 'M1', R.M1.value, '2026-03-20');
const m2 = a('mm2', 'M2', R.M2.value, '2026-03-20');
const m3 = a('mm3', 'M3', R.M3.value, '2026-03-20');
const m4 = a('mm4', 'M4', R.M4.value, '2026-03-20');
const m5 = a('mm5', 'M5', R.M5.value, '2026-03-20');
const mmh = human('mm6', 'Family is where my principles get tested most — see [[moral/family-duty]].', '2026-04-10');

// moral/rules-and-exceptions
const mr1 = a('re1', 'MR1', R.MR1.value, '2026-03-25');
const mr2 = a('re2', 'MR2', R.MR2.value, '2026-03-25');
const mr3 = a('re3', 'MR3', R.MR3.value, '2026-03-25');
const reh = human('re4', 'Volunteering at the screening clinic made “harms of omission” feel real, not abstract.', '2026-05-02');

// moral/family-duty
const md1 = a('fd1', 'MD1', R.MD1.value, '2026-04-10');
const md1n = line('fd2', 'li', `In my words: ${R.MD1.note}`, 'human', '2026-04-10', { src: 'MD1', answerNote: true });
const md2 = a('fd3', 'MD2', R.MD2.value, '2026-04-10');
const md3 = a('fd4', 'MD3', R.MD3.value, '2026-04-10');
const fd5 = human('fd5', 'Aai’s knee surgery is planned for spring 2027. I want to be in Pune for at least the first month.', '2026-06-15');
const fd5b = edited(fd5, 'Aai’s knee surgery is planned for spring 2027. I want to be in Pune for at least the first month — that part is non-negotiable.', '2026-09-30');

// priorities/main
const p1 = a('pm1', 'P1', R.P1.value, '2026-03-14');
const p2a = a('pm2', 'P2', hv('P2'), '2026-03-14');
const p2b = edited({ ...p2a }, QUESTION_BY_ID.P2.note(R.P2.value), '2026-09-12');
const p3 = a('pm3', 'P3', R.P3.value, '2026-03-14');
const p4 = a('pm4', 'P4', R.P4.value, '2026-03-14');
const p5 = a('pm5', 'P5', R.P5.value, '2026-03-14');
const pmh = human('pm6', 'Family still wins a real clash. Work comes first only for the next few years.', '2026-09-12');
const pmai = ai('pm7', 'Work or studies moved ahead of family in September, while family still wins when things clash.', '2026-09-13', 'P2');

// priorities/trade-offs
const pt1 = a('to1', 'PT1', R.PT1.value, '2026-03-15');
const pt2 = a('to2', 'PT2', R.PT2.value, '2026-03-15');
const pt3 = a('to3', 'PT3', R.PT3.value, '2026-03-15');

// identity/main and identity/tendencies
const i1 = a('id1', 'I1', R.I1.value, '2026-04-02');
const i2 = a('id2', 'I2', R.I2.value, '2026-04-02');
const i3 = a('id3', 'I3', R.I3.value, '2026-04-02');
const i4 = a('id4', 'I4', R.I4.value, '2026-04-02');
const tendencies = ['IT1', 'IT2', 'IT3', 'IT4', 'IT5'].map((qid, i) => a(`tn${i + 1}`, qid, R[qid].value, '2026-04-05'));

// goals/main
const g1a = a('gm1', 'G1', hv('G1'), '2026-05-18');
const g1b = edited({ ...g1a }, QUESTION_BY_ID.G1.note(R.G1.value), '2026-09-12');
const g2 = a('gm2', 'G2', R.G2.value, '2026-05-18');
const g3 = a('gm3', 'G3', R.G3.value, '2026-05-18');
const g4 = a('gm4', 'G4', R.G4.value, '2026-05-18');
const g6 = a('gm5', 'G6', R.G6.value, '2026-05-18');
const gm2 = a('gm6', 'GM2', R.GM2.value, '2026-06-20');
const g5 = a('gm7', 'G5', R.G5.value, '2026-09-12');
const gmh = human('gm8', 'Priorities shifted after the Zurich offer (3-year PhD position, starts Sept 2027). Retake goals once I’ve talked to Aai and Baba.', '2026-10-02');

// goals/work-and-study
const gc = ['GC1', 'GC2', 'GC3', 'GC4', 'GC5'].map((qid, i) => a(`ws${i + 1}`, qid, R[qid].value, '2026-09-14'));
const wsh1 = human('ws6', 'The Zurich lab is the best fit for the detection work. Offer deadline: **15 Dec 2026**.', '2026-09-20');
const wsh2 = human('ws7', 'Talked to the Bengaluru team: the industry job stays open until March.', '2026-10-11');

// goals/relationships-and-home
const gh1 = a('rh1', 'GH1', R.GH1.value, '2026-06-20');
const gh2 = a('rh2', 'GH2', R.GH2.value, '2026-06-20');
const rhh = human('rh3', 'I want to stay close enough to Aai and Baba that visiting isn’t a big event.', '2026-06-20');

type Versions = { history: FileVersion[]; current: FileVersion };
const empty = (id: string, date: string): Versions => ({ history: [], current: v(id, date, 'Created', []) });

const SAMPLE_VERSIONS: Record<string, Versions> = {
  'check-ins/log': {
    history: [
      v('cl-v1', '2026-08-14', 'Answers in Monthly Check-in', [c1a, c2a, c3a, c4a]),
      v('cl-v2', '2026-09-14', 'Answers in Monthly Check-in (retake)', [c1a, c2a, c3a, c4a, c1b, c2b, c3b, c4b]),
      v('cl-v3', '2026-10-14', 'Answers in Monthly Check-in (retake)', [c1a, c2a, c3a, c4a, c1b, c2b, c3b, c4b, c1c, c2c, c3c, c4c]),
    ],
    current: v('cl-v4', '2026-10-15', 'Edited', [c1a, c2a, c3a, c4a, c1b, c2b, c3b, c4b, c1c, c2c, c3c, c4c, clh]),
  },
  'worldview/main': {
    history: [
      v('wm-v1', '2026-03-16', 'Answers in Worldview & Beliefs', [w1a, w2, w3, w4a]),
      v('wm-v2', '2026-03-18', 'Edited', [w1a, w2, w3, w4a, wmh]),
      v('wm-v3', '2026-08-02', 'Answers in Worldview & Beliefs (retake)', [w1b, w2, w3, w4b, wmh, w5]),
    ],
    current: v('wm-v4', '2026-08-03', 'Summary line added', [w1b, w2, w3, w4b, wmh, w5, wmai]),
  },
  'worldview/control-and-change': {
    history: [v('cc-v1', '2026-10-11', 'Answers in Control & Change', [wc1, wc3])],
    current: v('cc-v2', '2026-10-11', 'Edited', [wc1, wc3, cch]),
  },
  'worldview/people-and-belief': empty('pb-v0', '2026-03-16'),
  'moral/main': {
    history: [v('mm-v1', '2026-03-20', 'Answers in Moral Principles', [m1, m2, m3, m4, m5])],
    current: v('mm-v2', '2026-04-10', 'Edited', [m1, m2, m3, m4, m5, mmh]),
  },
  'moral/rules-and-exceptions': {
    history: [v('re-v1', '2026-03-25', 'Answers in Rules & Exceptions', [mr1, mr2, mr3])],
    current: v('re-v2', '2026-05-02', 'Edited', [mr1, mr2, mr3, reh]),
  },
  'moral/fairness-and-loyalty': empty('fl-v0', '2026-03-20'),
  'moral/family-duty': {
    history: [
      v('fd-v1', '2026-04-10', 'Answers in Family Duty', [md1, md1n, md2, md3]),
      v('fd-v2', '2026-06-15', 'Edited', [locked(md1, '2026-04-11'), md1n, md2, md3, fd5]),
    ],
    current: v('fd-v3', '2026-09-30', 'Edited', [locked(md1, '2026-04-11'), md1n, md2, md3, fd5b]),
  },
  'priorities/main': {
    history: [
      v('pm-v1', '2026-03-14', 'Answers in Personal Priorities', [p1, p2a, p3, p4, p5]),
      v('pm-v2', '2026-09-12', 'Answers in Personal Priorities (retake)', [p1, p2b, p3, p4, p5, pmh]),
    ],
    current: v('pm-v3', '2026-09-13', 'Summary line added', [locked(p1, '2026-09-13'), p2b, p3, p4, p5, pmh, pmai]),
  },
  'priorities/trade-offs': { history: [], current: v('to-v1', '2026-03-15', 'Answers in What I’d Trade', [pt1, pt2, pt3]) },
  'identity/main': { history: [], current: v('id-v1', '2026-04-02', 'Answers in Identity & Self-concept', [i1, i2, i3, i4]) },
  'identity/tendencies': { history: [], current: v('tn-v1', '2026-04-05', 'Answers in How I Tend to Be', tendencies) },
  'identity/becoming': empty('ib-v0', '2026-04-02'),
  'goals/main': {
    history: [
      v('gm-v1', '2026-05-18', 'Answers in Goals & Aspirations', [g1a, g2, g3, g4, g6]),
      v('gm-v2', '2026-06-20', 'Answers in Other Areas', [g1a, g2, g3, g4, g6, gm2]),
      v('gm-v3', '2026-09-12', 'Answers in Goals & Aspirations (retake)', [g1b, g2, g3, g4, g6, gm2, g5]),
    ],
    current: v('gm-v4', '2026-10-02', 'Edited', [g1b, g2, g3, g4, g6, gm2, g5, gmh]),
  },
  'goals/work-and-study': {
    history: [
      v('ws-v1', '2026-09-14', 'Answers in Work & Study Path', gc),
      v('ws-v2', '2026-09-20', 'Edited', [...gc, wsh1]),
    ],
    current: v('ws-v3', '2026-10-11', 'Edited', [...gc, wsh1, wsh2]),
  },
  'goals/relationships-and-home': {
    history: [v('rh-v1', '2026-06-20', 'Answers in Relationships & Home', [gh1, gh2])],
    current: v('rh-v2', '2026-06-20', 'Edited', [gh1, gh2, rhh]),
  },
};

export function sampleFiles(): Record<string, NoteFile> {
  return Object.fromEntries(FILE_DEFS.map((d) => [d.id, { ...d, ...structuredClone(SAMPLE_VERSIONS[d.id]) }]));
}

export function emptyFiles(): Record<string, NoteFile> {
  return Object.fromEntries(
    FILE_DEFS.map((d) => [
      d.id,
      { ...d, history: [], current: { versionId: `${d.name}-v0`, createdAt: new Date().toISOString(), reason: 'Created', entries: [] } },
    ]),
  );
}

const done = (start: string, ...submissions: string[]): NodeProgress => ({
  startedAt: at(start),
  completedAt: submissions.length ? at(submissions[submissions.length - 1]) : undefined,
  submissions: submissions.map((d) => at(d)),
});

export const SAMPLE_PROGRESS: Record<string, NodeProgress> = {
  priorities: done('2026-03-14', '2026-03-14', '2026-09-12'),
  trades: done('2026-03-15', '2026-03-15'),
  worldview: done('2026-03-16', '2026-03-16', '2026-08-02'),
  control: done('2026-10-11'),
  moral: done('2026-03-20', '2026-03-20'),
  rules: done('2026-03-25', '2026-03-25'),
  family: done('2026-04-10', '2026-04-10'),
  identity: done('2026-04-02', '2026-04-02'),
  tendencies: done('2026-04-05', '2026-04-05'),
  goals: done('2026-05-18', '2026-05-18', '2026-09-12'),
  more: done('2026-06-20', '2026-06-20'),
  home: done('2026-06-20', '2026-06-20'),
  career: done('2026-09-14', '2026-09-14'),
  checkin: done('2026-08-14', '2026-08-14', '2026-09-14', '2026-10-14'),
};

export const SAMPLE_ONBOARDED_AT = at('2026-03-12');

/** Two areas opened by recent answers have not been looked at yet. */
export const SAMPLE_SEEN = [
  'root', 'priorities', 'trades', 'checkin', 'worldview', 'control', 'moral', 'rules', 'fairness', 'family',
  'identity', 'tendencies', 'becoming', 'goals', 'career', 'home', 'more',
];
