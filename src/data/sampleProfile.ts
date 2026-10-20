// Sample profile: "Priya Kulkarni", a 24-year-old MSc student in computational
// biology who started using the system in March 2026 and has an offer for a
// three-year PhD position in Zurich. Notes are written in the first person.
import type { Entry, EntryKind, FileVersion, NodeProgress, NoteFile, Provenance, Response } from '../types';
import { FILE_DEFS } from './files';

const at = (date: string, time = '10:00') => `${date}T${time}:00.000Z`;

function e(
  id: string,
  kind: EntryKind,
  text: string,
  provenance: Provenance,
  created: string,
  opts: { updated?: string; src?: string; locked?: boolean } = {},
): Entry {
  return {
    id,
    kind,
    text,
    provenance,
    createdAt: at(created),
    updatedAt: at(opts.updated ?? created),
    sourceItemId: opts.src,
    locked: opts.locked ?? false,
  };
}

const v = (id: string, date: string, reason: string, entries: Entry[]): FileVersion => ({
  versionId: id,
  createdAt: at(date, '18:30'),
  reason,
  entries,
});

const locked = (x: Entry, date: string): Entry => ({ ...x, locked: true, updatedAt: at(date) });

// ── ethics/main ───────────────────────────────────────────────
const em1 = e('em1', 'h', 'Ethical position at a glance', 'auto', '2026-03-14');
const em2 = e('em2', 'li', 'Avoiding harm to others is close to an absolute principle for me.', 'auto', '2026-03-14', { src: 'ETH-01' });
const em3 = e('em3', 'li', 'I would rather forgo a benefit to many than risk harming one innocent person.', 'auto', '2026-03-14', { src: 'ETH-02' });
const em2s = e('em2s', 'li', 'Leans strongly toward **idealism**: harm to an innocent person is close to an absolute limit, even when many others would benefit.', 'ai', '2026-03-20', { src: 'ETH-01' });
const em4 = e('em4', 'li', 'I am undecided on how much ethics varies across situations and cultures.', 'auto', '2026-03-14', { src: 'ETH-03' });
const em5 = e('em5', 'li', 'I prefer firm moral rules over case-by-case guidelines.', 'auto', '2026-03-14', { src: 'ETH-04' });
const em6 = e('em6', 'li', 'When family obligations and personal goals conflict, it depends on the situation.', 'auto', '2026-03-14', { src: 'ETH-05' });
const em7 = e('em7', 'quote', 'In my words: “Aaji wanted me to stay for her recovery during exam week. I stayed four days, then left — I still don’t know if that was enough.”', 'auto', '2026-03-14', { src: 'ETH-06' });
const em8 = e('em8', 'li', 'Family is where my principles get tested most — see [[ethics/family-obligations]].', 'human', '2026-04-10');
const em9 = e('em9', 'h', 'Open questions', 'human', '2026-08-02');
const em10 = e('em10', 'li', 'Idealist *and* rule-follower? I’m not sure those fit together.', 'human', '2026-08-02');
const em10b = { ...em10, text: 'Idealist *and* fond of firm rules — I’m not sure those fit together. Worth revisiting after [[ethics/moral-principles]].', updatedAt: at('2026-09-20') };

// ── ethics/moral-principles ───────────────────────────────────
const mp1 = e('mp1', 'h', 'How I judge actions', 'auto', '2026-03-20');
const mp2 = e('mp2', 'li', 'When judging actions I weigh its consequences for the people affected, then the intentions behind it most.', 'auto', '2026-03-20', { src: 'HRM-01' });
const mp3 = e('mp3', 'li', 'I hold myself responsible for harms I fail to prevent, not only harms I cause.', 'auto', '2026-03-20', { src: 'HRM-02' });
const mp4 = e('mp4', 'li', 'I accept small harms when they prevent a larger one.', 'auto', '2026-03-20', { src: 'HRM-03' });
const mp5 = e('mp5', 'li', 'Outcome-focused, with a firm harm-avoidance limit: consequences matter most, but not at any cost to an innocent person.', 'ai', '2026-03-21', { src: 'HRM-01' });
const mp6 = e('mp6', 'li', 'Volunteering at the screening clinic made “harms of omission” feel real rather than abstract.', 'human', '2026-05-02');

// ── ethics/family-obligations ─────────────────────────────────
const fo1 = e('fo1', 'h', 'What I owe my family', 'auto', '2026-04-10');
const fo2 = e('fo2', 'li', 'I believe adult children owe their parents personal care as they age.', 'auto', '2026-04-10', { src: 'FAM-01' });
const fo3 = e('fo3', 'li', 'What I owe my elders, at minimum: being nearby and available.', 'auto', '2026-04-10', { src: 'FAM-02' });
const fo4 = e('fo4', 'quote', 'Limit of the obligation — “It doesn’t require giving up my career, but it does require being reachable and back for the big moments. The line is being absent for something that can’t be repeated.”', 'auto', '2026-04-10', { src: 'FAM-03' });
const fo5 = e('fo5', 'li', 'Meeting family obligations is part of a good life for me, not only a constraint.', 'auto', '2026-04-10', { src: 'FAM-04' });
const fo6 = e('fo6', 'li', 'Family obligations are rated **highly important** and framed as part of a good life; the main limit named is missing irreplaceable moments.', 'ai', '2026-04-11', { src: 'FAM-01' });
const fo7 = e('fo7', 'li', 'Aai’s knee surgery is planned for spring 2027. I want to be in Pune for at least the first month.', 'human', '2026-06-15');
const fo7b = { ...fo7, text: 'Aai’s knee surgery is planned for spring 2027. I want to be in Pune for at least the first month — that part is non-negotiable.', updatedAt: at('2026-09-30') };

// ── worldview/main ────────────────────────────────────────────
const wm1 = e('wm1', 'h', 'Worldview snapshot', 'auto', '2026-03-16');
const wm2 = e('wm2', 'li', 'I see my life as mostly shaped by my own choices and effort.', 'auto', '2026-03-16', { src: 'WV-01' });
const wm2s = e('wm2s', 'li', 'Still sees choices and effort as the main driver, but less firmly than in March (5 → 4); later notes credit luck and support more.', 'ai', '2026-08-03', { src: 'WV-01' });
const wm3 = e('wm3', 'li', 'For important beliefs I trust scientific evidence, then personal experience most.', 'auto', '2026-03-16', { src: 'WV-02' });
const wm4 = e('wm4', 'li', 'I believe we have real obligations to strangers, not only to people close to us.', 'auto', '2026-03-16', { src: 'WV-03' });
const wm5 = e('wm5', 'quote', 'A belief I changed: “I used to think hard work was enough. Watching friends put in the same effort and end up in very different places changed that.”', 'auto', '2026-08-02', { src: 'WV-04' });
const wm6 = e('wm6', 'li', '*Exploratory questions, not a validated scale* — I’m treating these as prompts, not a personality result.', 'human', '2026-03-18');
const wm7 = e('wm7', 'li', 'Started [[worldview/personal-agency]] — want to finish it before the Zurich decision.', 'human', '2026-10-11');

// ── worldview/personal-agency ─────────────────────────────────
const pa1 = e('pa1', 'li', 'When plans fail, I look first at my own part in it.', 'auto', '2026-10-11', { src: 'AGY-01' });
const pa2 = e('pa2', 'li', 'Honestly: I blame myself first and only notice the circumstances later.', 'human', '2026-10-11');

// ── worldview/obligations-to-others ───────────────────────────
const oo1 = e('oo1', 'h', 'Whose wellbeing counts', 'auto', '2026-05-02');
const oo2 = e('oo2', 'li', 'If I can prevent serious harm to a stranger at modest cost, I am obliged to.', 'auto', '2026-05-02', { src: 'OTH-01' });
const oo3 = e('oo3', 'li', 'In major decisions I weigh family, then myself most, and strangers in need least.', 'auto', '2026-05-02', { src: 'OTH-02' });
const oo4 = e('oo4', 'li', 'Strangers last surprised me. Maybe “obliged to help” and “weigh most” are different things.', 'human', '2026-05-03');

// ── long-term-goals/main ──────────────────────────────────────
const gm1 = e('gm1', 'h', 'Main goal', 'auto', '2026-05-18');
const gm2 = e('gm2', 'li', 'Goal: Complete a PhD in computational biology and build a research career working on early disease detection. (importance 8/10)', 'auto', '2026-05-18', { src: 'GOL-01' });
const gm2b = { ...gm2, text: 'Goal: Complete a PhD in computational biology and build a research career on tools for early disease detection. (importance 9/10)', updatedAt: at('2026-09-12') };
const gm3 = e('gm3', 'quote', 'Why it matters: “It combines what I’m good at with something that helps people directly. Ajoba’s late diagnosis is part of why early detection matters to me.”', 'auto', '2026-05-18', { src: 'GOL-02' });
const gm4 = e('gm4', 'li', 'Pursuing this goal probably will not require leaving home.', 'auto', '2026-05-18', { src: 'GOL-03' });
const gm4b = { ...gm4, text: 'Pursuing this goal will likely mean relocating or long periods away from home.', updatedAt: at('2026-09-12') };
const gm5 = e('gm5', 'li', 'Priorities for the next ten years: career & work, then family & relationships, then health.', 'auto', '2026-05-18', { src: 'GOL-04' });
const gm6 = e('gm6', 'li', 'A single, high-importance career goal anchored in a personal reason; the main recent change is that it now likely involves relocation.', 'ai', '2026-09-13', { src: 'GOL-01' });
const gm7 = e('gm7', 'li', 'Priorities shifted after the Zurich offer (3-year PhD position, starts Sept 2027). Retake goals once I’ve talked to Aai and Baba.', 'human', '2026-10-02');

// ── long-term-goals/career ────────────────────────────────────
const ca1 = e('ca1', 'h', 'Direction', 'auto', '2026-09-14');
const ca2 = e('ca2', 'quote', 'Work in ten years: “Leading a small team building open diagnostic tools, with enough time left to teach.”', 'auto', '2026-09-14', { src: 'CAR-01' });
const ca3 = e('ca3', 'li', 'I would accept a significant move for the right opportunity.', 'auto', '2026-09-14', { src: 'CAR-02' });
const ca4 = e('ca4', 'li', 'What matters most in my next role: impact.', 'auto', '2026-09-14', { src: 'CAR-03' });
const ca5 = e('ca5', 'li', 'The Zurich lab is the best fit for the detection work. Offer deadline: **15 Dec 2026**.', 'human', '2026-09-20');

// ── long-term-goals/relationships ─────────────────────────────
const rl1 = e('rl1', 'li', 'I want to stay close enough to Aai and Baba that visiting isn’t a big event.', 'human', '2026-06-20');

type Versions = { history: FileVersion[]; current: FileVersion };

const SAMPLE_VERSIONS: Record<string, Versions> = {
  'ethics/main': {
    history: [
      v('em-v1', '2026-03-14', 'Generated from Ethics assessment', [em1, em2, em3, em4, em5, em6, em7]),
      v('em-v2', '2026-03-20', 'AI summary committed', [em1, em2s, em4, em5, em6, em7]),
      v('em-v3', '2026-04-10', 'Manual edit', [em1, em2s, em4, em5, em6, em7, em8]),
      v('em-v4', '2026-08-02', 'Manual edit', [em1, em2s, em4, em5, em6, em7, em8, em9, em10]),
    ],
    current: v('em-v5', '2026-09-20', 'Manual edit', [em1, em2s, em4, em5, locked(em6, '2026-09-20'), em7, em8, em9, em10b]),
  },
  'ethics/moral-principles': {
    history: [
      v('mp-v1', '2026-03-20', 'Generated from Harm & Consequences', [mp1, mp2, mp3, mp4]),
      v('mp-v2', '2026-03-21', 'AI summary line added', [mp1, mp2, mp3, mp4, mp5]),
    ],
    current: v('mp-v3', '2026-05-02', 'Manual edit', [mp1, mp2, mp3, mp4, mp5, mp6]),
  },
  'ethics/family-obligations': {
    history: [
      v('fo-v1', '2026-04-10', 'Generated from Obligations to Elders & Family', [fo1, fo2, fo3, fo4, fo5]),
      v('fo-v2', '2026-04-11', 'AI summary line added', [fo1, locked(fo2, '2026-04-11'), fo3, fo4, fo5, fo6]),
      v('fo-v3', '2026-06-15', 'Manual edit', [fo1, locked(fo2, '2026-04-11'), fo3, fo4, fo5, fo6, fo7]),
    ],
    current: v('fo-v4', '2026-09-30', 'Manual edit', [fo1, locked(fo2, '2026-04-11'), fo3, fo4, fo5, fo6, fo7b]),
  },
  'worldview/main': {
    history: [
      v('wm-v1', '2026-03-16', 'Generated from Worldview assessment', [wm1, wm2, wm3, wm4]),
      v('wm-v2', '2026-03-18', 'Manual edit', [wm1, wm2, wm3, wm4, wm6]),
      v('wm-v3', '2026-08-02', 'Generated from Worldview retake', [wm1, wm2, wm3, wm4, wm5, wm6]),
      v('wm-v4', '2026-08-03', 'AI summary committed', [wm1, wm2s, wm3, wm4, wm5, wm6]),
    ],
    current: v('wm-v5', '2026-10-11', 'Manual edit', [wm1, wm2s, wm3, wm4, wm5, wm6, wm7]),
  },
  'worldview/personal-agency': {
    history: [v('pa-v1', '2026-10-11', 'Generated from Personal Agency (partial)', [pa1])],
    current: v('pa-v2', '2026-10-11', 'Manual edit', [pa1, pa2]),
  },
  'worldview/sources-of-knowledge': {
    history: [],
    current: v('sk-v1', '2026-08-02', 'File created', []),
  },
  'worldview/obligations-to-others': {
    history: [v('oo-v1', '2026-05-02', 'Generated from Obligations to Others', [oo1, oo2, oo3])],
    current: v('oo-v2', '2026-05-03', 'Manual edit', [oo1, oo2, oo3, oo4]),
  },
  'long-term-goals/main': {
    history: [
      v('gm-v1', '2026-05-18', 'Generated from Long-term Goals assessment', [gm1, gm2, gm3, gm4, gm5]),
      v('gm-v2', '2026-09-12', 'Generated from Long-term Goals retake', [gm1, gm2b, gm3, gm4b, gm5]),
      v('gm-v3', '2026-09-13', 'AI summary line added', [gm1, gm2b, gm3, gm4b, gm5, gm6]),
    ],
    current: v('gm-v4', '2026-10-02', 'Manual edit', [gm1, locked(gm2b, '2026-10-02'), gm3, gm4b, gm5, gm6, gm7]),
  },
  'long-term-goals/career': {
    history: [v('ca-v1', '2026-09-14', 'Generated from Career Direction', [ca1, ca2, ca3, ca4])],
    current: v('ca-v2', '2026-09-20', 'Manual edit', [ca1, ca2, ca3, ca4, ca5]),
  },
  'long-term-goals/relationships': {
    history: [],
    current: v('rl-v1', '2026-06-20', 'Manual edit', [rl1]),
  },
};

export function sampleFiles(): Record<string, NoteFile> {
  return Object.fromEntries(
    FILE_DEFS.map((d) => [d.id, { ...d, ...structuredClone(SAMPLE_VERSIONS[d.id]) }]),
  );
}

export function emptyFiles(): Record<string, NoteFile> {
  return Object.fromEntries(
    FILE_DEFS.map((d) => [
      d.id,
      { ...d, history: [], current: { versionId: `${d.name}-v0`, createdAt: new Date().toISOString(), reason: 'File created', entries: [] } },
    ]),
  );
}

const r = (value: Response['value'], date: string, confidence?: number, history?: Response['history']): Response => ({
  value,
  answeredAt: at(date),
  confidence,
  history,
});

export const SAMPLE_RESPONSES: Record<string, Response> = {
  'ETH-01': r(5, '2026-03-14', 4),
  'ETH-02': r(4, '2026-03-14'),
  'ETH-03': r(3, '2026-03-14', 3),
  'ETH-04': r(2, '2026-03-14'),
  'ETH-05': r('depends', '2026-03-14', 2),
  'ETH-06': r('Aaji wanted me to stay for her recovery during exam week. I stayed four days, then left — I still don’t know if that was enough.', '2026-03-14'),
  'HRM-01': r(['consequences', 'intentions', 'fairness', 'rules'], '2026-03-20'),
  'HRM-02': r(4, '2026-03-20', 4),
  'HRM-03': r(4, '2026-03-20'),
  'FAM-01': r(4, '2026-04-10', 3),
  'FAM-02': r('nearby', '2026-04-10'),
  'FAM-03': r('It doesn’t require giving up my career, but it does require being reachable and back for the big moments. The line is being absent for something that can’t be repeated.', '2026-04-10', 3),
  'FAM-04': r(5, '2026-04-10'),
  'WV-01': r(4, '2026-08-02', 3, [{ value: 5, confidence: 4, answeredAt: at('2026-03-16') }]),
  'WV-02': r(['science', 'experience', 'people', 'intuition', 'tradition'], '2026-08-02'),
  'WV-03': r(4, '2026-08-02', 4),
  'WV-04': r('I used to think hard work was enough. Watching friends put in the same effort and end up in very different places changed that.', '2026-08-02'),
  'OTH-01': r(4, '2026-05-02', 3),
  'OTH-02': r(['family', 'self', 'close', 'community', 'strangers'], '2026-05-02'),
  'AGY-01': r(4, '2026-10-11'),
  'GOL-01': r(
    { text: 'Complete a PhD in computational biology and build a research career on tools for early disease detection.', importance: 9 },
    '2026-09-12',
    undefined,
    [{ value: { text: 'Complete a PhD in computational biology and build a research career working on early disease detection.', importance: 8 }, answeredAt: at('2026-05-18') }],
  ),
  'GOL-02': r('It combines what I’m good at with something that helps people directly. Ajoba’s late diagnosis is part of why early detection matters to me.', '2026-09-12', 4),
  'GOL-03': r(4, '2026-09-12', undefined, [{ value: 2, answeredAt: at('2026-05-18') }]),
  'GOL-04': r(['career', 'family', 'health', 'learning', 'community'], '2026-09-12'),
  'CAR-01': r('Leading a small team building open diagnostic tools, with enough time left to teach.', '2026-09-14'),
  'CAR-02': r(4, '2026-09-14', 2),
  'CAR-03': r('impact', '2026-09-14'),
};

export const SAMPLE_PROGRESS: Record<string, NodeProgress> = {
  ethics: { startedAt: at('2026-03-14'), completedAt: at('2026-03-14'), submissions: [at('2026-03-14')] },
  'eth-harm': { startedAt: at('2026-03-20'), completedAt: at('2026-03-20'), submissions: [at('2026-03-20')] },
  'eth-family': { startedAt: at('2026-04-10'), completedAt: at('2026-04-10'), submissions: [at('2026-04-10')] },
  worldview: { startedAt: at('2026-03-16'), completedAt: at('2026-08-02'), submissions: [at('2026-03-16'), at('2026-08-02')] },
  'wv-others': { startedAt: at('2026-05-02'), completedAt: at('2026-05-02'), submissions: [at('2026-05-02')] },
  'wv-agency': { startedAt: at('2026-10-11'), submissions: [] },
  goals: { startedAt: at('2026-05-18'), completedAt: at('2026-09-12'), submissions: [at('2026-05-18'), at('2026-09-12')] },
  'goal-career': { startedAt: at('2026-09-14'), completedAt: at('2026-09-14'), submissions: [at('2026-09-14')] },
};

export const SAMPLE_ONBOARDED_AT = at('2026-03-12');

/** Everything except the most recently unlocked node has been looked at. */
export const SAMPLE_SEEN = [
  'root', 'ethics', 'worldview', 'goals', 'eth-harm', 'eth-universal', 'eth-family',
  'wv-agency', 'wv-knowledge', 'wv-others', 'goal-career', 'goal-rel', 'goal-values',
];
