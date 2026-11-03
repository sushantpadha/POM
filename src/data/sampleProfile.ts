// Sample profile: "Priya", a 24-year-old MSc student in computational biology who
// started using the prototype in March 2026 and has an offer for a three-year PhD
// position in Zurich. Notes are written in the first person. Fictional data.
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
const edited = (x: Entry, text: string, date: string): Entry => ({ ...x, text, updatedAt: at(date) });

// ── ethics/main ───────────────────────────────────────────────
const em1 = e('em1', 'h', 'Summary', 'ai', '2026-03-20');
const em2 = e('em2', 'li', 'Leans towards avoiding harm: an action that could hurt an innocent person is ruled out, even a small risk.', 'ai', '2026-03-20', { src: 'MP1' });
const em3 = e('em3', 'li', 'Undecided on whether ethics depends on culture, but thinks whether a lie is wrong depends on the circumstances.', 'ai', '2026-03-20', { src: 'E2' });
const em4 = e('em4', 'li', 'Family is where my principles get tested most — see [[ethics/family-obligations]].', 'human', '2026-04-10');
const em5 = e('em5', 'li', 'Open question: I avoid harm almost absolutely, yet I’d break a promise to prevent it. Is that consistent?', 'human', '2026-09-20');

// ── ethics/moral-principles ───────────────────────────────────
const mp1 = e('mp1', 'h', 'How I judge actions', 'auto', '2026-03-14');
const mp2 = e('mp2', 'li', 'If an action could harm an innocent person, I think it should not be done.', 'auto', '2026-03-14', { src: 'E1' });
const mp3 = e('mp3', 'li', 'I am undecided on whether ethics depends on the situation and culture.', 'auto', '2026-03-14', { src: 'E2' });
const mp4 = e('mp4', 'quote', 'Promise vs. minor harm: “Probably yes, if the harm is real and the promise is small. I’d tell the person afterwards why I broke it.”', 'auto', '2026-03-14', { src: 'E3' });
const mp5 = e('mp5', 'li', 'When I judge an action I look first at its consequences, then the intentions behind it.', 'auto', '2026-03-14', { src: 'E5' });
const mp6 = e('mp6', 'li', 'Risking harm to another person is never acceptable to me, even a small risk.', 'auto', '2026-03-20', { src: 'MP1' });
const mp7 = e('mp7', 'li', 'Doing the right thing should not mean someone gets hurt.', 'auto', '2026-03-20', { src: 'MP2' });
const mp8 = e('mp8', 'li', 'Whether a lie is wrong depends on the circumstances.', 'auto', '2026-03-20', { src: 'MP3' });
const mp9 = e('mp9', 'li', 'I think moral standards are shared, not just personal.', 'auto', '2026-03-20', { src: 'MP4' });
const mp10 = e('mp10', 'li', 'Volunteering at the screening clinic made “harms of omission” feel real, not abstract.', 'human', '2026-05-02');

// ── ethics/family-obligations ─────────────────────────────────
const fo1 = e('fo1', 'h', 'What I owe my family', 'auto', '2026-03-14');
const fo2 = e('fo2', 'li', 'What I owe my elders in time, money or career decisions: 8/10 — a lot.', 'auto', '2026-03-14', { src: 'E4' });
const fo3 = e('fo3', 'li', 'I want to support my parents later in life because of what they have given me.', 'auto', '2026-04-10', { src: 'FR1' });
const fo4 = e('fo4', 'li', 'On major decisions, I think children can go against their parents’ wishes.', 'auto', '2026-04-10', { src: 'FR2' });
const fo5 = e('fo5', 'quote', 'Where the obligation stops: “It doesn’t require giving up my career, but it does require being reachable and back for the big moments. The line is being absent for something that can’t be repeated.”', 'auto', '2026-04-10', { src: 'FR3' });
const fo6 = e('fo6', 'li', 'Owes family a lot (8/10), framed as gratitude rather than obedience; the limit named is missing moments that can’t be repeated.', 'ai', '2026-04-11', { src: 'FR1' });
const fo7 = e('fo7', 'li', 'Aai’s knee surgery is planned for spring 2027. I want to be in Pune for at least the first month.', 'human', '2026-06-15');
const fo7b = edited(fo7, 'Aai’s knee surgery is planned for spring 2027. I want to be in Pune for at least the first month — that part is non-negotiable.', '2026-09-30');

// ── worldview/main ────────────────────────────────────────────
const wm1 = e('wm1', 'h', 'Beliefs', 'auto', '2026-08-02');
const wm2 = e('wm2', 'quote', 'A belief I changed: “I used to think hard work was enough. Watching friends put in the same effort and end up in very different places changed that.”', 'auto', '2026-08-02', { src: 'W4' });
const wm3 = e('wm3', 'li', 'These are prompts for reflection, not a personality result.', 'human', '2026-03-18');
const wm4 = e('wm4', 'li', 'Started [[worldview/personal-agency]] — want to finish it before the Zurich decision.', 'human', '2026-10-11');

// ── worldview/personal-agency ─────────────────────────────────
const pa1 = e('pa1', 'li', 'My own choices matter more than luck or circumstances in shaping my life.', 'auto', '2026-03-16', { src: 'W1' });
const pa2 = e('pa2', 'li', 'Still sees own choices as the main driver, but less firmly than in March (W1: 5 → 4).', 'ai', '2026-08-03', { src: 'W1' });
const pa3 = e('pa3', 'li', 'Honestly: I blame myself first and only notice the circumstances later.', 'human', '2026-10-11');

// ── worldview/sources-of-knowledge ────────────────────────────
const sk1 = e('sk1', 'li', 'To decide what is true I rely most on experts, then experience.', 'auto', '2026-03-16', { src: 'W2' });

// ── worldview/obligations-to-others ───────────────────────────
const oo1 = e('oo1', 'li', 'My responsibility toward people outside my family or community: 7/10.', 'auto', '2026-03-16', { src: 'W3' });
const oo2 = e('oo2', 'li', 'I mean this practically: time at the screening clinic, not just caring in principle.', 'human', '2026-05-03');

// ── long-term-goals/main ──────────────────────────────────────
const gm1 = e('gm1', 'h', 'Priorities', 'auto', '2026-05-18');
const gm2 = e('gm2', 'li', 'Importance: financial success 4/10, close relationships 9/10, personal growth 8/10, recognition 3/10, community 3/10.', 'auto', '2026-05-18', { src: 'G3' });
const gm3 = e('gm3', 'li', 'Attention over the next ten years: family & relationships, then career & work, then health.', 'auto', '2026-05-18', { src: 'G5' });
const gm3b = edited(gm3, 'Attention over the next ten years: career & work, then family & relationships, then health.', '2026-09-12');
const gm4 = e('gm4', 'li', 'Career has moved ahead of family in the ten-year ranking since May, while close relationships are still rated 9/10 in importance.', 'ai', '2026-09-13', { src: 'G5' });
const gm5 = e('gm5', 'li', 'Priorities shifted after the Zurich offer (3-year PhD position, starts Sept 2027). Retake goals once I’ve talked to Aai and Baba.', 'human', '2026-10-02');

// ── long-term-goals/career ────────────────────────────────────
const ca1 = e('ca1', 'h', 'Current project', 'auto', '2026-05-18');
const ca2 = e('ca2', 'li', 'Project: Finishing my MSc thesis on early cancer detection from blood samples (importance 8/10, control 7/10)', 'auto', '2026-05-18', { src: 'G1' });
const ca2b = edited(ca2, 'Project: Finishing my MSc thesis on early cancer detection from blood samples (importance 9/10, control 6/10)', '2026-09-12');
const ca3 = e('ca3', 'quote', 'In ten years, if things go well: “Leading a small team that builds open diagnostic tools, with time left to teach — and close enough to home to visit often.”', 'auto', '2026-05-18', { src: 'G2' });
const ca4 = e('ca4', 'li', 'About my project: enjoyment 8/10, stress 7/10, progress so far 5/10, personal fit 9/10.', 'auto', '2026-09-14', { src: 'PP1' });
const ca5 = e('ca5', 'li', 'Time with family or close people this project asks me to give up: 7/10.', 'auto', '2026-09-14', { src: 'PP2' });
const ca6 = e('ca6', 'li', 'The Zurich lab is the best fit for the detection work. Offer deadline: **15 Dec 2026**.', 'human', '2026-09-20');

// ── long-term-goals/relationships ─────────────────────────────
const rl1 = e('rl1', 'quote', 'In ten years, if things go well: “Leading a small team that builds open diagnostic tools, with time left to teach — and close enough to home to visit often.”', 'auto', '2026-05-18', { src: 'G2' });
const rl2 = e('rl2', 'quote', 'Family and relationship life I want: “Close to my parents, a partner who wants a similar life, and friends I still see every month.”', 'auto', '2026-05-18', { src: 'G4' });
const rl3 = e('rl3', 'li', 'I want to stay close enough to Aai and Baba that visiting isn’t a big event.', 'human', '2026-06-20');

type Versions = { history: FileVersion[]; current: FileVersion };

const SAMPLE_VERSIONS: Record<string, Versions> = {
  'ethics/main': {
    history: [
      v('em-v1', '2026-03-20', 'Summary drafted', [em1, em2, em3]),
      v('em-v2', '2026-04-10', 'Edited', [em1, em2, em3, em4]),
    ],
    current: v('em-v3', '2026-09-20', 'Edited', [em1, em2, em3, em4, em5]),
  },
  'ethics/moral-principles': {
    history: [
      v('mp-v1', '2026-03-14', 'Answers in Ethics', [mp1, mp2, mp3, mp4, mp5]),
      v('mp-v2', '2026-03-20', 'Answers in Moral Principles', [mp1, mp2, mp3, mp4, mp5, mp6, mp7, mp8, mp9]),
    ],
    current: v('mp-v3', '2026-05-02', 'Edited', [mp1, mp2, mp3, mp4, mp5, mp6, mp7, mp8, mp9, mp10]),
  },
  'ethics/family-obligations': {
    history: [
      v('fo-v1', '2026-03-14', 'Answers in Ethics', [fo1, fo2]),
      v('fo-v2', '2026-04-10', 'Answers in Family Relationships', [fo1, fo2, fo3, fo4, fo5]),
      v('fo-v3', '2026-04-11', 'Summary line added', [fo1, fo2, locked(fo3, '2026-04-11'), fo4, fo5, fo6]),
      v('fo-v4', '2026-06-15', 'Edited', [fo1, fo2, locked(fo3, '2026-04-11'), fo4, fo5, fo6, fo7]),
    ],
    current: v('fo-v5', '2026-09-30', 'Edited', [fo1, fo2, locked(fo3, '2026-04-11'), fo4, fo5, fo6, fo7b]),
  },
  'worldview/main': {
    history: [
      v('wm-v1', '2026-03-18', 'Edited', [wm3]),
      v('wm-v2', '2026-08-02', 'Answers in Worldview / Beliefs (retake)', [wm1, wm2, wm3]),
    ],
    current: v('wm-v3', '2026-10-11', 'Edited', [wm1, wm2, wm3, wm4]),
  },
  'worldview/personal-agency': {
    history: [
      v('pa-v1', '2026-03-16', 'Answers in Worldview / Beliefs', [pa1]),
      v('pa-v2', '2026-08-03', 'Summary line added', [pa1, pa2]),
    ],
    current: v('pa-v3', '2026-10-11', 'Edited', [pa1, pa2, pa3]),
  },
  'worldview/sources-of-knowledge': {
    history: [],
    current: v('sk-v1', '2026-03-16', 'Answers in Worldview / Beliefs', [sk1]),
  },
  'worldview/obligations-to-others': {
    history: [v('oo-v1', '2026-03-16', 'Answers in Worldview / Beliefs', [oo1])],
    current: v('oo-v2', '2026-05-03', 'Edited', [oo1, oo2]),
  },
  'long-term-goals/main': {
    history: [
      v('gm-v1', '2026-05-18', 'Answers in Long-term Goals', [gm1, gm2, gm3]),
      v('gm-v2', '2026-09-12', 'Answers in Long-term Goals (retake)', [gm1, gm2, gm3b]),
      v('gm-v3', '2026-09-13', 'Summary line added', [gm1, gm2, gm3b, gm4]),
    ],
    current: v('gm-v4', '2026-10-02', 'Edited', [gm1, locked(gm2, '2026-10-02'), gm3b, gm4, gm5]),
  },
  'long-term-goals/career': {
    history: [
      v('ca-v1', '2026-05-18', 'Answers in Long-term Goals', [ca1, ca2, ca3]),
      v('ca-v2', '2026-09-12', 'Answers in Long-term Goals (retake)', [ca1, ca2b, ca3]),
      v('ca-v3', '2026-09-14', 'Answers in Personal Projects', [ca1, ca2b, ca3, ca4, ca5]),
    ],
    current: v('ca-v4', '2026-09-20', 'Edited', [ca1, ca2b, ca3, ca4, ca5, ca6]),
  },
  'long-term-goals/relationships': {
    history: [v('rl-v1', '2026-05-18', 'Answers in Long-term Goals', [rl1, rl2])],
    current: v('rl-v2', '2026-06-20', 'Edited', [rl1, rl2, rl3]),
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
      { ...d, history: [], current: { versionId: `${d.name}-v0`, createdAt: new Date().toISOString(), reason: 'Created', entries: [] } },
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
  E1: r(4, '2026-03-14'),
  E2: r(3, '2026-03-14'),
  E3: r('Probably yes, if the harm is real and the promise is small. I’d tell the person afterwards why I broke it.', '2026-03-14'),
  E4: r(8, '2026-03-14', 3),
  E5: r(['consequences', 'intentions', 'fairness', 'rule'], '2026-03-14'),
  MP1: r(4, '2026-03-20', 4),
  MP2: r(2, '2026-03-20'),
  MP3: r(4, '2026-03-20'),
  MP4: r(2, '2026-03-20'),
  FR1: r(5, '2026-04-10'),
  FR2: r(2, '2026-04-10'),
  FR3: r('It doesn’t require giving up my career, but it does require being reachable and back for the big moments. The line is being absent for something that can’t be repeated.', '2026-04-10', 3),
  W1: r(4, '2026-08-02', 3, [{ value: 5, confidence: 4, answeredAt: at('2026-03-16') }]),
  W2: r(['experts', 'experience', 'tradition', 'intuition', 'texts'], '2026-03-16'),
  W3: r(7, '2026-03-16'),
  W4: r('I used to think hard work was enough. Watching friends put in the same effort and end up in very different places changed that.', '2026-08-02'),
  PA1: r('internal', '2026-10-11'),
  G1: r(
    { text: 'Finishing my MSc thesis on early cancer detection from blood samples', ratings: { importance: 9, control: 6 } },
    '2026-09-12',
    undefined,
    [{ value: { text: 'Finishing my MSc thesis on early cancer detection from blood samples', ratings: { importance: 8, control: 7 } }, answeredAt: at('2026-05-18') }],
  ),
  G2: r('Leading a small team that builds open diagnostic tools, with time left to teach — and close enough to home to visit often.', '2026-05-18'),
  G3: r({ wealth: 4, relationships: 9, growth: 8, recognition: 3, community: 3 }, '2026-05-18'),
  G4: r('Close to my parents, a partner who wants a similar life, and friends I still see every month.', '2026-05-18'),
  G5: r(['career', 'family', 'health', 'learning', 'community'], '2026-09-12', undefined, [
    { value: ['family', 'career', 'health', 'learning', 'community'], answeredAt: at('2026-05-18') },
  ]),
  PP1: r({ enjoyment: 8, stress: 7, progress: 5, fit: 9 }, '2026-09-14'),
  PP2: r(7, '2026-09-14', 2),
};

export const SAMPLE_PROGRESS: Record<string, NodeProgress> = {
  ethics: { startedAt: at('2026-03-14'), completedAt: at('2026-03-14'), submissions: [at('2026-03-14')] },
  moral: { startedAt: at('2026-03-20'), completedAt: at('2026-03-20'), submissions: [at('2026-03-20')] },
  family: { startedAt: at('2026-04-10'), completedAt: at('2026-04-10'), submissions: [at('2026-04-10')] },
  worldview: { startedAt: at('2026-03-16'), completedAt: at('2026-08-02'), submissions: [at('2026-03-16'), at('2026-08-02')] },
  agency: { startedAt: at('2026-10-11'), submissions: [] },
  goals: { startedAt: at('2026-05-18'), completedAt: at('2026-09-12'), submissions: [at('2026-05-18'), at('2026-09-12')] },
  projects: { startedAt: at('2026-09-14'), completedAt: at('2026-09-14'), submissions: [at('2026-09-14')] },
};

export const SAMPLE_ONBOARDED_AT = at('2026-03-12');

/** Everything except the most recently opened node has been looked at. */
export const SAMPLE_SEEN = ['root', 'ethics', 'worldview', 'goals', 'moral', 'family', 'agency', 'projects', 'aspirations'];
