import type { AnswerValue, Option, ProjectAnswer, Question, Response } from '../types';

// The v2 item set (PLAN_V2.md, section 2.4): five branches, 63 branch items, four opt-in
// one-liners and a four-item monthly check-in. All wording is our own. "Adapted" items
// paraphrase a published item; "informed" items are our wording on a published construct.
// No instrument is given in full and nothing is scored.

/** Bumped whenever item ids or meanings change. Logged by experiment mode and exports. */
export const QUESTION_SET_VERSION = 2;

export const LIKERT_LABELS = ['Strongly disagree', 'Disagree', 'Neither', 'Agree', 'Strongly agree'];

// ── Note helpers: every note reads as a sentence the person could have written. ──

function agree(v: AnswerValue, high: string, mid: string, low: string): string {
  const n = Number(v);
  if (n >= 4) return high;
  if (n === 3) return mid;
  return low;
}

function tenPoint(v: AnswerValue, high: string, mid: string, low: string): string {
  const n = Number(v);
  if (n >= 7) return high;
  if (n >= 4) return mid;
  return low;
}

export function optionLabel(options: Option[], v: AnswerValue): string {
  return options.find((o) => o.value === v)?.label ?? String(v);
}

/** "a, b and c" */
export function listJoin(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function picked(options: Option[], v: AnswerValue, except?: string): string[] {
  const vals = Array.isArray(v) ? v : [];
  return vals.filter((x) => x !== except).map((x) => lower(optionLabel(options, x)));
}

function ranked(options: Option[], v: AnswerValue, take = 3): string {
  const order = Array.isArray(v) ? v : [];
  return order
    .slice(0, take)
    .map((x) => lower(optionLabel(options, x)))
    .join(', then ');
}

const quote = (lead: string) => (v: AnswerValue) => `${lead}: “${String(v).trim()}”`;

const pick = (map: Record<string, string>) => (v: AnswerValue) => map[String(v)] ?? '';

const has = (qid: string, value: string) => (r: Record<string, Response>) => {
  const v = r[qid]?.value;
  return Array.isArray(v) && v.includes(value);
};
const is = (qid: string, value: string) => (r: Record<string, Response>) => r[qid]?.value === value;

// ── Shared option sets ──

/** The six life areas of P2, reused by the check-in (C1) and tension 3. */
export const LIFE_AREAS: Option[] = [
  { value: 'work', label: 'Work or studies' },
  { value: 'family', label: 'Family' },
  { value: 'partner', label: 'Partner' },
  { value: 'friends', label: 'Friends' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning and hobbies' },
];

const DEPTH: Option[] = [
  { value: 'settled', label: 'Settled' },
  { value: 'simple', label: 'Simple (just needs doing)' },
  { value: 'explore', label: 'Worth exploring' },
];

const P1_OPTS: Option[] = [
  { value: 'partner', label: 'Partner or close relationships' },
  { value: 'family', label: 'Family' },
  { value: 'work', label: 'Work or studies' },
  { value: 'place', label: 'Where I live' },
  { value: 'money', label: 'Money' },
  { value: 'depends', label: 'It depends' },
];

const P3_OPTS: Option[] = [
  { value: 'autonomy', label: 'Choosing my own way' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'security', label: 'Security' },
  { value: 'relationships', label: 'Close relationships' },
  { value: 'helping', label: 'Helping others' },
  { value: 'creativity', label: 'Creativity' },
  { value: 'tradition', label: 'Tradition' },
  { value: 'enjoyment', label: 'Enjoyment' },
  { value: 'influence', label: 'Influence' },
  { value: 'adventure', label: 'Adventure' },
];

const P5_OPTS: Option[] = [
  { value: 'problems', label: 'Interesting problems' },
  { value: 'growth', label: 'Growth' },
  { value: 'money', label: 'Money' },
  { value: 'prestige', label: 'Prestige' },
  { value: 'impact', label: 'Impact' },
  { value: 'stability', label: 'Stability' },
  { value: 'flexibility', label: 'Flexibility' },
];

const G4_OPTS: Option[] = [
  { value: 'partner', label: 'A partner I live with' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'children', label: 'Children' },
  { value: 'near-parents', label: 'Living near my parents' },
  { value: 'friends', label: 'Close friends nearby' },
  { value: 'abroad', label: 'Living abroad for a while' },
  { value: 'unsure', label: 'Not sure yet' },
];

const G6_OPTS: Option[] = [
  { value: 'money', label: 'Money goals' },
  { value: 'parents', label: 'Ageing parents' },
  { value: 'health', label: 'Health' },
  { value: 'own', label: 'Starting something of my own' },
  { value: 'none', label: 'None of these' },
];

const I2_OPTS: Option[] = [
  'Curiosity', 'Persistence', 'Kindness', 'Honesty', 'Humour', 'Leadership', 'Creativity',
  'Calm under pressure', 'Fairness', 'Discipline', 'Courage', 'Good with people',
].map((label) => ({ value: label.toLowerCase().replace(/ /g, '-'), label }));

const I3_OPTS: Option[] = [
  { value: 'student', label: 'Student' },
  { value: 'professional', label: 'Working professional' },
  { value: 'child', label: 'Son or daughter' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'partner', label: 'Partner' },
  { value: 'parent', label: 'Parent' },
  { value: 'friend', label: 'Friend' },
  { value: 'builder', label: 'Builder or creator' },
  { value: 'community', label: 'Member of a community or faith' },
];

const M3_OPTS: Option[] = [
  { value: 'outcome', label: 'What it led to' },
  { value: 'rule', label: 'Whether a rule or promise was kept' },
  { value: 'intent', label: 'What the person meant' },
  { value: 'fair', label: 'Whether it was fair to everyone' },
];

const PROJECT_SLIDERS: Option[] = [{ value: 'control', label: 'How much is in my control' }];

// ── Sources ──
const SCHWARTZ = 'Informed by Schwartz’s theory of basic human values.';
const PPA = 'Personal Projects Analysis (Little, 1983).';
const BPS = 'Best Possible Self exercise (King, 2001).';
const SCC = 'Informed by self-concept clarity (Campbell et al., 1996).';
const IPIP = 'Informed by the International Personality Item Pool (Goldberg et al., 2006); one item per trait, not a scale.';
const TRUST = 'Informed by the generalised-trust question used in social surveys.';
const PRIMALS = 'Informed by primal world beliefs (Clifton et al., 2019).';
const MINDSET = 'Informed by research on implicit theories of personality (Dweck).';
const EPQ = 'Ethics Position Questionnaire (EPQ-5), Forsyth.';
const MFT = 'Informed by moral foundations theory (Haidt & Graham).';
const FILIAL = 'Informed by the dual filial piety model (Yeh & Bedford, 2003).';
const OWN = 'Our own question.';

const F = {
  log: 'check-ins/log',
  wMain: 'worldview/main',
  wControl: 'worldview/control-and-change',
  wSociety: 'worldview/people-and-belief',
  mMain: 'moral/main',
  mRules: 'moral/rules-and-exceptions',
  mFair: 'moral/fairness-and-loyalty',
  mFamily: 'moral/family-duty',
  pMain: 'priorities/main',
  pTrade: 'priorities/trade-offs',
  iMain: 'identity/main',
  iTend: 'identity/tendencies',
  iBecoming: 'identity/becoming',
  gMain: 'goals/main',
  gWork: 'goals/work-and-study',
  gHome: 'goals/relationships-and-home',
};

type Q = Omit<Question, 'stability' | 'source' | 'sourceNote'> &
  Partial<Pick<Question, 'source' | 'sourceNote'>> & { stability: 'St' | 'Fl' };

const items: Q[] = [
  // ── Personal Priorities ─────────────────────────────────────
  {
    id: 'P1', nodeId: 'priorities', stability: 'St', type: 'choice', fileIds: [F.pMain], selfTags: ['priority'],
    text: 'When two things you want clash, which usually wins?',
    options: P1_OPTS,
    why: 'Most later trade-offs depend on this one, so it comes first.',
    note: (v) => (v === 'depends' ? 'When two things I want clash, it depends which wins.' : `When two things I want clash, ${lower(optionLabel(P1_OPTS, v))} usually wins.`),
  },
  {
    id: 'P2', nodeId: 'priorities', stability: 'Fl', type: 'rank', fileIds: [F.pMain], selfTags: ['life-areas'],
    text: 'Rank these by the attention you want to give them over the next few years: work or studies, family, partner, friends, health, learning and hobbies.',
    help: 'Put what you want to give the most attention first.',
    options: LIFE_AREAS,
    why: 'The monthly check-in compares where your time went with this order.',
    note: (v) => `Over the next few years I want to give most attention to ${ranked(LIFE_AREAS, v)}.`,
  },
  {
    id: 'P3', nodeId: 'priorities', stability: 'St', type: 'multi', max: 3, fileIds: [F.pMain], selfTags: ['values'],
    text: 'Pick up to three that matter most to you.',
    options: P3_OPTS,
    source: 'informed', sourceNote: SCHWARTZ,
    why: 'A short list of what matters most is easier to come back to than a full ranking.',
    note: (v) => `What matters most to me: ${listJoin(picked(P3_OPTS, v))}.`,
  },
  {
    id: 'P4', nodeId: 'priorities', stability: 'St', type: 'choice', fileIds: [F.pMain], selfTags: ['money'],
    text: 'What is money mainly for?',
    options: [
      { value: 'comfort', label: 'Comfort' },
      { value: 'security', label: 'Security' },
      { value: 'scoreboard', label: 'A scoreboard' },
      { value: 'freedom', label: 'Freedom to change paths later' },
      { value: 'providing', label: 'Providing for others' },
    ],
    why: 'What money is for shapes many trade-offs between time, place and work.',
    note: pick({
      comfort: 'For me, money is mainly for comfort.',
      security: 'For me, money is mainly for security.',
      scoreboard: 'For me, money is mainly a scoreboard.',
      freedom: 'For me, money is mainly freedom to change paths later.',
      providing: 'For me, money is mainly for providing for others.',
    }),
  },
  {
    id: 'P5', nodeId: 'priorities', stability: 'Fl', type: 'multi', max: 2, fileIds: [F.pMain], selfTags: ['work-values'],
    text: 'Pick the two things you most want from work or studies.',
    options: P5_OPTS,
    why: 'Useful when comparing paths or offers later.',
    note: (v) => `From work or studies I most want ${listJoin(picked(P5_OPTS, v))}.`,
  },
  {
    id: 'PT1', nodeId: 'trades', stability: 'Fl', type: 'choice', fileIds: [F.pTrade], selfTags: ['trade'],
    text: 'I would rather have:',
    options: [
      { value: 'money', label: 'More money and less free time' },
      { value: 'time', label: 'Less money and more free time' },
    ],
    why: 'A plain either-or shows which way you lean when both cannot be had.',
    note: pick({ money: 'I would rather have more money and less free time.', time: 'I would rather have less money and more free time.' }),
  },
  {
    id: 'PT2', nodeId: 'trades', stability: 'St', type: 'choice', fileIds: [F.pTrade], selfTags: ['trade'],
    text: 'I would rather have:',
    options: [
      { value: 'stable', label: 'A stable, predictable life' },
      { value: 'open', label: 'An open, changing life' },
    ],
    why: 'A plain either-or shows which way you lean when both cannot be had.',
    note: pick({ stable: 'I would rather have a stable, predictable life.', open: 'I would rather have an open, changing life.' }),
  },
  {
    id: 'PT3', nodeId: 'trades', stability: 'Fl', type: 'choice', fileIds: [F.pTrade], selfTags: ['trade'],
    text: 'I would rather be:',
    options: [
      { value: 'near', label: 'Near the people I love' },
      { value: 'opportunities', label: 'Where the best opportunities are' },
    ],
    why: 'A plain either-or shows which way you lean when both cannot be had.',
    note: pick({ near: 'I would rather be near the people I love.', opportunities: 'I would rather be where the best opportunities are.' }),
  },
  {
    id: 'PC1', nodeId: 'clashes', stability: 'Fl', type: 'choice', fileIds: [F.pTrade], selfTags: ['tradeoff'],
    text: 'An important opportunity would mean seeing your family much less for several years. You would most likely:',
    options: [
      { value: 'take', label: 'Take it' },
      { value: 'limited', label: 'Take it for a limited time' },
      { value: 'decline', label: 'Turn it down' },
    ],
    why: 'A concrete case is easier to answer than a general ranking.',
    note: pick({
      take: 'If an opportunity meant seeing my family much less for several years, I would most likely take it.',
      limited: 'If an opportunity meant seeing my family much less for several years, I would most likely take it for a limited time.',
      decline: 'If an opportunity meant seeing my family much less for several years, I would most likely turn it down.',
    }),
  },
  {
    id: 'PC2', nodeId: 'clashes', stability: 'Fl', type: 'text', fileIds: [F.pTrade], selfTags: ['tradeoff'],
    text: 'Is there an option you rank lower that would win under certain conditions? Name it and the conditions.',
    placeholder: 'e.g. Family would win if one of my parents became ill.',
    why: 'Rankings hide conditions. This records the “it depends”.',
    note: quote('A lower option that could still win'),
  },

  // ── Goals & Aspirations ─────────────────────────────────────
  {
    id: 'G1', nodeId: 'goals', stability: 'Fl', type: 'project', sliders: PROJECT_SLIDERS, fileIds: [F.gMain], selfTags: ['career'],
    text: 'What is the main thing you are working toward right now? How much of it is in your control?',
    scale: ['None of it', 'All of it'],
    placeholder: 'e.g. Getting into a master’s programme',
    source: 'adapted', sourceNote: `Adapted from ${PPA}`,
    why: 'Names what you are working toward now, and how much of it is up to you.',
    note: (v) => {
      const p = v as ProjectAnswer;
      const c = p.ratings?.control;
      return `Right now I am working toward: ${p.text.trim().replace(/\.$/, '')}.${c === undefined ? '' : ` About ${c} out of 10 of it is in my control.`}`;
    },
  },
  {
    id: 'G2', nodeId: 'goals', stability: 'Fl', type: 'text', fileIds: [F.gMain], selfTags: ['future'],
    text: 'Picture an ordinary good day five years from now. Where are you, who is around, what are you doing?',
    placeholder: 'e.g. A small flat in Bengaluru, cooking with friends after a day at the lab.',
    source: 'adapted', sourceNote: `Adapted from the ${BPS}`,
    why: 'An ordinary day is easier to picture than a big goal, and says a lot about what you want.',
    note: quote('An ordinary good day five years from now'),
  },
  {
    id: 'G3', nodeId: 'goals', stability: 'Fl', type: 'choice', fileIds: [F.gMain], selfTags: ['career'],
    text: 'Your work or study path right now:',
    options: [
      { value: 'choosing', label: 'Still choosing' },
      { value: 'narrowing', label: 'Narrowing down a few' },
      { value: 'settled', label: 'Settled' },
    ],
    why: 'Shows how open your path is right now.',
    note: pick({
      choosing: 'I am still choosing my work or study path.',
      narrowing: 'I am narrowing my work or study path down to a few options.',
      settled: 'My work or study path is settled.',
    }),
  },
  {
    id: 'G4', nodeId: 'goals', stability: 'Fl', type: 'multi', exclusive: 'unsure', fileIds: [F.gMain], selfTags: ['relationships'],
    text: 'Which of these do you want in your life in five years?',
    options: G4_OPTS,
    why: 'Pick as many as apply. These often depend on other people, so they open questions about home and family.',
    note: (v) => {
      const list = picked(G4_OPTS, v, 'unsure');
      return list.length ? `In five years I want these in my life: ${listJoin(list)}.` : 'I am not sure yet what I want my life to include in five years.';
    },
  },
  {
    id: 'G5', nodeId: 'goals', stability: 'Fl', type: 'text', fileIds: [F.gMain], selfTags: ['goals'],
    text: 'Is there an upcoming event that could change these answers (results, an offer, a move)? Optional.',
    placeholder: 'e.g. Exam results in June',
    why: 'If you name one, it is listed under Revisit as a reminder to look at your goals again.',
    note: quote('An upcoming event that could change these answers'),
  },
  {
    id: 'G6', nodeId: 'goals', stability: 'Fl', type: 'multi', exclusive: 'none', fileIds: [F.gMain], selfTags: ['more-areas'],
    tagsFor: (v) => (Array.isArray(v) && v.some((x) => x !== 'none') ? ['more-areas'] : []),
    text: 'Want to look at any of these?',
    options: G6_OPTS,
    why: 'Each one you pick adds one short question. Nothing is added for “None of these”.',
    note: (v) => {
      const list = picked(G6_OPTS, v, 'none');
      return list.length ? `I want to look more closely at ${listJoin(list)}.` : '';
    },
  },
  {
    id: 'GC1', nodeId: 'career', stability: 'Fl', type: 'choice', fileIds: [F.gWork], selfTags: ['career-depth'],
    text: 'Is your work or study direction settled, simple (just needs doing), or worth exploring?',
    options: DEPTH,
    why: 'You set the depth. Only “worth exploring” adds the follow-up questions.',
    note: pick({
      settled: 'My work or study direction is settled.',
      simple: 'My work or study direction is simple: it just needs doing.',
      explore: 'My work or study direction is worth exploring.',
    }),
  },
  {
    id: 'GC2', nodeId: 'career', stability: 'Fl', type: 'text', fileIds: [F.gWork], selfTags: ['career-paths'],
    showIf: is('GC1', 'explore'),
    text: 'List the paths you are considering, one per line. Mark each: active, interested, untried or ruled out.',
    placeholder: 'e.g. Data science — active\nTeaching — untried',
    why: 'Writing the options down, with where each stands, makes them easier to compare.',
    note: quote('Paths I am considering'),
  },
  {
    id: 'GC3', nodeId: 'career', stability: 'Fl', type: 'text', fileIds: [F.gWork], selfTags: ['career-paths'],
    showIf: is('GC1', 'explore'),
    text: 'What is the honest reason your first choice is first?',
    placeholder: 'e.g. It pays well and my friends are doing it.',
    why: 'Naming the reason makes it easier to check later.',
    note: quote('The honest reason my first choice is first'),
  },
  {
    id: 'GC4', nodeId: 'career', stability: 'Fl', type: 'text', fileIds: [F.gWork], selfTags: ['career-paths'],
    showIf: is('GC1', 'explore'),
    text: 'For one untested path, what is the cheapest test you could run in the next six months?',
    placeholder: 'e.g. Shadow a teacher for a week in the summer.',
    why: 'Turns an open question into something you can try.',
    note: quote('The cheapest test I could run in the next six months'),
  },
  {
    id: 'GC5', nodeId: 'career', stability: 'Fl', type: 'slider', fileIds: [F.gWork], selfTags: ['work-cost'],
    text: 'How much time with the people close to you does your current work or study take away?',
    scale: ['None', 'A great deal'],
    source: 'adapted', sourceNote: `Adapted from ${PPA}`,
    why: 'What work costs in time with people is often the real trade-off.',
    note: (v) =>
      tenPoint(
        v,
        `My current work or study takes a lot of time away from the people close to me (${v}/10).`,
        `My current work or study takes some time away from the people close to me (${v}/10).`,
        `My current work or study takes little time away from the people close to me (${v}/10).`,
      ),
  },
  {
    id: 'GH1', nodeId: 'home', stability: 'Fl', type: 'choice', fileIds: [F.gHome], selfTags: ['home-depth'],
    text: 'Is where and with whom you live settled, simple, or worth exploring?',
    options: DEPTH,
    why: 'You set the depth. Only “worth exploring” adds the follow-up questions.',
    note: pick({
      settled: 'Where and with whom I live is settled.',
      simple: 'Where and with whom I live is simple: it just needs doing.',
      explore: 'Where and with whom I live is worth exploring.',
    }),
  },
  {
    id: 'GH2', nodeId: 'home', stability: 'Fl', type: 'text', fileIds: [F.gHome], selfTags: ['home'],
    showIf: is('GH1', 'explore'),
    text: 'If no one constrained you, where would you live? Would you try several places or pick one?',
    placeholder: 'e.g. Try a few years in Europe, then settle near home.',
    why: 'Separates what you want from what you expect to be allowed.',
    note: quote('If no one constrained me, where I would live'),
  },
  {
    id: 'GH3', nodeId: 'home', stability: 'Fl', type: 'text', fileIds: [F.gHome], selfTags: ['home'],
    showIf: is('GH1', 'explore'),
    text: 'If this depends on someone else’s decision, list the realistic scenarios and what triggers each.',
    placeholder: 'e.g. If my partner gets the Delhi job, we move there.',
    why: 'When someone else decides, scenarios are more useful than a single answer.',
    note: quote('Scenarios that depend on someone else’s decision'),
  },
  {
    id: 'GM1', nodeId: 'more', stability: 'Fl', type: 'text', fileIds: [F.gMain], selfTags: ['more'], showIf: has('G6', 'money'),
    text: 'Money: what amount or state would feel like “enough”?',
    placeholder: 'e.g. No debt and six months of savings.',
    why: 'You picked money goals.',
    note: quote('Enough money, for me'),
  },
  {
    id: 'GM2', nodeId: 'more', stability: 'Fl', type: 'text', fileIds: [F.gMain], selfTags: ['more'], showIf: has('G6', 'parents'),
    text: 'Ageing parents: what do you expect to do, and from where?',
    placeholder: 'e.g. Visit every few months; move back if one of them needs care.',
    why: 'You picked ageing parents.',
    note: quote('With my ageing parents, I expect to'),
  },
  {
    id: 'GM3', nodeId: 'more', stability: 'Fl', type: 'text', fileIds: [F.gMain], selfTags: ['more'], showIf: has('G6', 'health'),
    text: 'Health: one thing you want to be true in five years.',
    placeholder: 'e.g. I can run 10 km without stopping.',
    why: 'You picked health.',
    note: quote('Something I want to be true of my health in five years'),
  },
  {
    id: 'GM4', nodeId: 'more', stability: 'Fl', type: 'text', fileIds: [F.gMain], selfTags: ['more'], showIf: has('G6', 'own'),
    text: 'Something of your own: what would it be, and what would have to be true to start?',
    placeholder: 'e.g. A small design studio, once I have two steady clients.',
    why: 'You picked starting something of your own.',
    note: quote('Something of my own'),
  },

  // ── Identity & Self-concept ─────────────────────────────────
  {
    id: 'I1', nodeId: 'identity', stability: 'St', type: 'text', fileIds: [F.iMain], selfTags: ['self-image'],
    text: 'Describe yourself in three words.',
    placeholder: 'e.g. Curious, stubborn, loyal',
    why: 'Three words are quick to write and easy to compare a year from now.',
    note: quote('Me in three words'),
  },
  {
    id: 'I2', nodeId: 'identity', stability: 'St', type: 'multi', max: 3, fileIds: [F.iMain], selfTags: ['strengths'],
    text: 'Pick three strengths.',
    options: I2_OPTS,
    why: 'What you see as your strengths is part of how you see yourself.',
    note: (v) => `My strengths: ${listJoin(picked(I2_OPTS, v))}.`,
  },
  {
    id: 'I3', nodeId: 'identity', stability: 'Fl', type: 'multi', max: 3, fileIds: [F.iMain], selfTags: ['roles'],
    text: 'Which roles matter most to who you are? Pick up to three.',
    options: I3_OPTS,
    why: 'Roles change with life stage. This is one to compare over the years.',
    note: (v) => `The roles that matter most to who I am: ${listJoin(picked(I3_OPTS, v))}.`,
  },
  {
    id: 'I4', nodeId: 'identity', stability: 'St', type: 'likert', fileIds: [F.iMain], selfTags: ['clarity'],
    text: 'I have a clear sense of who I am.',
    source: 'informed', sourceNote: SCC,
    why: 'Compared later with how close you feel to the person you want to be.',
    note: (v) => agree(v, 'I have a clear sense of who I am.', 'I have a partly clear sense of who I am.', 'I don’t have a clear sense of who I am yet.'),
  },
  {
    id: 'IT1', nodeId: 'tendencies', stability: 'St', type: 'likert', fileIds: [F.iTend], selfTags: ['tendency'],
    text: 'I get energy from being around people.',
    source: 'informed', sourceNote: IPIP,
    why: 'One of five quick statements about how you tend to be. Not a personality score.',
    note: (v) => agree(v, 'I get energy from being around people.', 'Being around people sometimes gives me energy and sometimes drains it.', 'Being around people doesn’t usually give me energy.'),
  },
  {
    id: 'IT2', nodeId: 'tendencies', stability: 'St', type: 'likert', fileIds: [F.iTend], selfTags: ['tendency'],
    text: 'I like trying new and unfamiliar things.',
    source: 'informed', sourceNote: IPIP,
    why: 'One of five quick statements about how you tend to be. Not a personality score.',
    note: (v) => agree(v, 'I like trying new and unfamiliar things.', 'I am in two minds about new and unfamiliar things.', 'I prefer the familiar to new and unfamiliar things.'),
  },
  {
    id: 'IT3', nodeId: 'tendencies', stability: 'St', type: 'likert', fileIds: [F.iTend], selfTags: ['tendency'],
    text: 'I plan ahead and finish what I start.',
    source: 'informed', sourceNote: IPIP,
    why: 'One of five quick statements about how you tend to be. Not a personality score.',
    note: (v) => agree(v, 'I plan ahead and finish what I start.', 'I sometimes plan ahead and finish what I start.', 'I don’t usually plan far ahead or finish everything I start.'),
  },
  {
    id: 'IT4', nodeId: 'tendencies', stability: 'St', type: 'likert', fileIds: [F.iTend], selfTags: ['tendency'],
    text: 'I worry about things a lot.',
    source: 'informed', sourceNote: IPIP,
    why: 'One of five quick statements about how you tend to be. Not a personality score.',
    note: (v) => agree(v, 'I worry about things a lot.', 'I worry about things sometimes.', 'I don’t worry about things much.'),
  },
  {
    id: 'IT5', nodeId: 'tendencies', stability: 'St', type: 'likert', fileIds: [F.iTend], selfTags: ['tendency'],
    text: 'I would rather keep the peace than win an argument.',
    source: 'informed', sourceNote: IPIP,
    why: 'One of five quick statements about how you tend to be. Not a personality score.',
    note: (v) => agree(v, 'I would rather keep the peace than win an argument.', 'Whether I keep the peace or argue my point depends on the situation.', 'I would rather win an argument than keep the peace.'),
  },
  {
    id: 'IB1', nodeId: 'becoming', stability: 'St', type: 'text', fileIds: [F.iBecoming], selfTags: ['becoming'],
    text: 'When do you feel most like yourself?',
    placeholder: 'e.g. Late at night, working on something with friends.',
    why: 'A moment is easier to name than a trait.',
    note: quote('When I feel most like myself'),
  },
  {
    id: 'IB2', nodeId: 'becoming', stability: 'Fl', type: 'text', fileIds: [F.iBecoming], selfTags: ['becoming'],
    text: 'One thing about yourself you struggle with or want to get better at.',
    placeholder: 'e.g. Saying no when I am already busy.',
    why: 'Something to look back at in a few months.',
    note: quote('Something I struggle with or want to get better at'),
  },
  {
    id: 'IB3', nodeId: 'becoming', stability: 'St', type: 'likert', fileIds: [F.iBecoming], selfTags: ['becoming'],
    text: 'People close to me see me the way I see myself.',
    why: 'How others see you can differ from how you see yourself.',
    note: (v) => agree(v, 'People close to me see me the way I see myself.', 'People close to me partly see me the way I see myself.', 'People close to me see me differently from how I see myself.'),
  },

  // ── Worldview & Beliefs ─────────────────────────────────────
  {
    id: 'W1', nodeId: 'worldview', stability: 'St', type: 'likert', fileIds: [F.wMain], selfTags: ['agency'],
    text: 'My own choices matter more than luck or circumstances in shaping my life.',
    source: 'adapted', sourceNote: 'Adapted from the locus-of-control construct (Rotter, 1966).',
    why: 'Asks how much of your life you see as in your own hands.',
    note: (v) => agree(v, 'My own choices matter more than luck or circumstances in shaping my life.', 'I give my choices and my circumstances about equal weight.', 'Luck and circumstances shape my life more than my choices.'),
  },
  {
    id: 'W2', nodeId: 'worldview', stability: 'St', type: 'likert', fileIds: [F.wMain], selfTags: ['trust'],
    text: 'Most people can be trusted.',
    source: 'informed', sourceNote: TRUST,
    why: 'How much you trust people by default shapes many everyday choices.',
    note: (v) => agree(v, 'I mostly trust people.', 'I trust some people and am careful with others.', 'I am careful about trusting people.'),
  },
  {
    id: 'W3', nodeId: 'worldview', stability: 'St', type: 'likert', fileIds: [F.wMain], selfTags: ['world'],
    text: 'On the whole, the world is more good than dangerous.',
    source: 'informed', sourceNote: PRIMALS,
    why: 'A broad belief about the world that colours how much risk feels reasonable.',
    note: (v) => agree(v, 'On the whole, I see the world as more good than dangerous.', 'I see the world as about as good as it is dangerous.', 'On the whole, I see the world as more dangerous than good.'),
  },
  {
    id: 'W4', nodeId: 'worldview', stability: 'St', type: 'likert', fileIds: [F.wMain], selfTags: ['agency'],
    text: 'Hard work usually pays off.',
    why: 'People differ a lot on this, and it can change with experience.',
    note: (v) => agree(v, 'I think hard work usually pays off.', 'I am not sure hard work usually pays off.', 'I don’t think hard work usually pays off.'),
  },
  {
    id: 'W5', nodeId: 'worldview', stability: 'Fl', type: 'text', fileIds: [F.wMain], selfTags: ['worldview'],
    text: 'Name one belief you’ve changed in the last two years.',
    placeholder: 'e.g. I used to think grades were what mattered most.',
    why: 'Beliefs change. Noticing one that did is part of reflecting.',
    note: quote('A belief I changed in the last two years'),
  },
  {
    id: 'WC1', nodeId: 'control', stability: 'St', type: 'choice', fileIds: [F.wControl], selfTags: ['agency-belief'],
    text: 'Which is closer to what you believe?',
    options: [
      { value: 'internal', label: 'Getting ahead mostly depends on effort and ability.' },
      { value: 'external', label: 'Getting ahead mostly depends on being in the right place at the right time.' },
    ],
    source: 'adapted', sourceNote: 'Adapted from Rotter’s locus-of-control scale (1966), forced-choice format.',
    why: 'A forced choice between two views you might both partly hold.',
    note: pick({
      internal: 'I believe getting ahead mostly depends on effort and ability.',
      external: 'I believe getting ahead mostly depends on being in the right place at the right time.',
    }),
  },
  {
    id: 'WC2', nodeId: 'control', stability: 'St', type: 'likert', fileIds: [F.wControl], selfTags: ['agency-belief'],
    text: 'People can change who they are in important ways.',
    source: 'informed', sourceNote: MINDSET,
    why: 'Whether people can change affects how you see yourself and others over time.',
    note: (v) => agree(v, 'I think people can change who they are in important ways.', 'I think people can change some things about who they are.', 'I think people stay much the same in the ways that matter.'),
  },
  {
    id: 'WC3', nodeId: 'control', stability: 'Fl', type: 'slider', fileIds: [F.wControl], selfTags: ['agency-belief'],
    text: 'Think of something that went well recently. How much was you, and how much was luck or help?',
    scale: ['All luck or help', 'All me'],
    why: 'A recent example, set beside your general belief about choices and luck.',
    note: (v) => `Of something that went well recently, I credit about ${v} out of 10 to myself and the rest to luck or help.`,
  },
  {
    id: 'WS1', nodeId: 'society', stability: 'St', type: 'choice', fileIds: [F.wSociety], selfTags: ['society'],
    text: 'People are mostly shaped by:',
    options: [
      { value: 'upbringing', label: 'Their upbringing and surroundings' },
      { value: 'choices', label: 'Their own choices' },
      { value: 'born', label: 'What they are born with' },
    ],
    why: 'What you think shapes people affects how you judge them, and yourself.',
    note: pick({
      upbringing: 'I think people are mostly shaped by their upbringing and surroundings.',
      choices: 'I think people are mostly shaped by their own choices.',
      born: 'I think people are mostly shaped by what they are born with.',
    }),
  },
  {
    id: 'WS2', nodeId: 'society', stability: 'St', type: 'choice', fileIds: [F.wSociety], selfTags: ['society'],
    text: 'A lasting relationship is mostly:',
    options: [
      { value: 'find', label: 'Finding the right person' },
      { value: 'build', label: 'Building it together' },
    ],
    why: 'A belief that shapes how you approach relationships.',
    note: pick({
      find: 'I think a lasting relationship is mostly about finding the right person.',
      build: 'I think a lasting relationship is mostly about building it together.',
    }),
  },
  {
    id: 'WS3', nodeId: 'society', stability: 'St', type: 'choice', fileIds: [F.wSociety], selfTags: ['society'],
    text: 'Religion or spirituality in how I understand the world:',
    options: [
      { value: 'central', label: 'Central' },
      { value: 'some', label: 'Some part' },
      { value: 'little', label: 'Little or none' },
    ],
    why: 'How large a part faith plays in how you see the world.',
    note: pick({
      central: 'Religion or spirituality is central to how I understand the world.',
      some: 'Religion or spirituality is some part of how I understand the world.',
      little: 'Religion or spirituality plays little or no part in how I understand the world.',
    }),
  },
  {
    id: 'WS4', nodeId: 'society', stability: 'St', type: 'choice', fileIds: [F.wSociety], selfTags: ['society'],
    text: 'When you need to decide what is true, what do you trust most?',
    options: [
      { value: 'experts', label: 'Experts' },
      { value: 'experience', label: 'My own experience' },
      { value: 'tradition', label: 'Family or tradition' },
      { value: 'intuition', label: 'Intuition' },
      { value: 'texts', label: 'Texts' },
    ],
    why: 'Where you turn when you need to know what is true.',
    note: pick({
      experts: 'To decide what is true, I trust experts most.',
      experience: 'To decide what is true, I trust my own experience most.',
      tradition: 'To decide what is true, I trust family or tradition most.',
      intuition: 'To decide what is true, I trust my intuition most.',
      texts: 'To decide what is true, I trust texts most.',
    }),
  },
  {
    id: 'WS5', nodeId: 'society', stability: 'Fl', type: 'text', fileIds: [F.wSociety], selfTags: ['society'],
    text: 'Something I believe that my family or most people around me don’t.',
    placeholder: 'e.g. That a gap year is not wasted time.',
    why: 'Puts into words where your views differ from those around you.',
    note: quote('Something I believe that my family or most people around me don’t'),
  },

  // ── Moral Principles ────────────────────────────────────────
  {
    id: 'M1', nodeId: 'moral', stability: 'St', type: 'choice', fileIds: [F.mMain], selfTags: ['loyalty'],
    text: 'A close friend is doing something clearly wrong, such as cheating or lying to someone. You:',
    options: [
      { value: 'stay-out', label: 'Stay out of it' },
      { value: 'talk', label: 'Talk to them' },
      { value: 'tell', label: 'Tell someone who can stop it' },
    ],
    why: 'A small situation shows how you weigh loyalty against right and wrong.',
    note: pick({
      'stay-out': 'If a close friend were doing something clearly wrong, I would stay out of it.',
      talk: 'If a close friend were doing something clearly wrong, I would talk to them.',
      tell: 'If a close friend were doing something clearly wrong, I would tell someone who can stop it.',
    }),
  },
  {
    id: 'M2', nodeId: 'moral', stability: 'St', type: 'choice', fileIds: [F.mMain], selfTags: ['honesty'],
    text: 'A friend shows you work they are proud of, and it isn’t good. You:',
    options: [
      { value: 'plain', label: 'Say so plainly' },
      { value: 'soften', label: 'Soften it' },
      { value: 'praise', label: 'Say it’s good' },
    ],
    why: 'A small situation shows how you weigh honesty against kindness.',
    note: pick({
      plain: 'If a friend’s work weren’t good, I would say so plainly.',
      soften: 'If a friend’s work weren’t good, I would soften it.',
      praise: 'If a friend’s work weren’t good, I would say it’s good.',
    }),
  },
  {
    id: 'M3', nodeId: 'moral', stability: 'St', type: 'choice', fileIds: [F.mMain], selfTags: ['judging'],
    text: 'When you judge whether something was right, what counts most?',
    options: M3_OPTS,
    why: 'Shows what you look at first when you judge right and wrong.',
    note: (v) => (v ? `When I judge whether something was right, what counts most is ${lower(optionLabel(M3_OPTS, v))}.` : ''),
  },
  {
    id: 'M4', nodeId: 'moral', stability: 'St', type: 'likert', fileIds: [F.mMain], selfTags: ['relativism'],
    text: 'What is ethical depends on the situation and culture; no rule applies everywhere.',
    source: 'adapted', sourceNote: `${EPQ} Relativism.`,
    why: 'Asks whether you see moral rules as universal or as depending on context.',
    note: (v) => agree(v, 'I think what is ethical depends on the situation and culture.', 'I am undecided on whether ethics depends on the situation and culture.', 'I think some moral rules apply everywhere.'),
  },
  {
    id: 'M5', nodeId: 'moral', stability: 'Fl', type: 'slider', fileIds: [F.mMain], selfTags: ['family-duty'], askConfidence: true,
    text: 'How much do you feel you owe your parents or elders in time, money or big decisions?',
    scale: ['Nothing in particular', 'A great deal'],
    why: 'Family duties often shape big decisions. This answer can change as your life does.',
    note: (v) =>
      tenPoint(
        v,
        `I feel I owe my parents or elders a lot in time, money or big decisions (${v}/10).`,
        `I feel I owe my parents or elders something in time, money or big decisions (${v}/10).`,
        `I don’t feel I owe my parents or elders much in time, money or big decisions (${v}/10).`,
      ),
  },
  {
    id: 'MR1', nodeId: 'rules', stability: 'St', type: 'likert', fileIds: [F.mRules], selfTags: ['rules'],
    text: 'Doing the right thing sometimes means accepting that someone will be hurt.',
    source: 'adapted', sourceNote: `${EPQ} Idealism, reverse-worded.`,
    why: 'Asks whether avoiding harm can ever give way.',
    note: (v) => agree(v, 'Doing the right thing can mean accepting that someone gets hurt.', 'I am unsure whether doing right can justify someone getting hurt.', 'Doing the right thing should not mean someone gets hurt.'),
  },
  {
    id: 'MR2', nodeId: 'rules', stability: 'St', type: 'choice', fileIds: [F.mRules], selfTags: ['rules'],
    text: 'Would you break a promise to prevent a small harm to a stranger?',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'depends', label: 'Depends on the promise' },
    ],
    why: 'A concrete case shows how you apply your principles when two of them pull apart.',
    note: pick({
      yes: 'I would break a promise to prevent a small harm to a stranger.',
      no: 'I would keep a promise even to prevent a small harm to a stranger.',
      depends: 'Whether I would break a promise to prevent a small harm to a stranger depends on the promise.',
    }),
  },
  {
    id: 'MR3', nodeId: 'rules', stability: 'St', type: 'text', fileIds: [F.mRules], selfTags: ['rules'],
    text: 'Is there something you would never do, whatever the reason?',
    placeholder: 'e.g. Lie to my parents about something serious.',
    why: 'A hard line, in your own words.',
    note: quote('Something I would never do, whatever the reason'),
  },
  {
    id: 'MF1', nodeId: 'fairness', stability: 'St', type: 'choice', fileIds: [F.mFair], selfTags: ['fairness'],
    text: 'A fair split is:',
    options: [
      { value: 'equal', label: 'Equal for everyone' },
      { value: 'effort', label: 'By effort' },
      { value: 'need', label: 'By need' },
    ],
    source: 'informed', sourceNote: MFT,
    why: 'People hold different, reasonable ideas of what is fair.',
    note: pick({
      equal: 'I think a fair split is equal for everyone.',
      effort: 'I think a fair split is by effort.',
      need: 'I think a fair split is by need.',
    }),
  },
  {
    id: 'MF2', nodeId: 'fairness', stability: 'St', type: 'likert', fileIds: [F.mFair], selfTags: ['fairness'],
    text: 'I should stand by my family or group even when they are in the wrong.',
    source: 'informed', sourceNote: MFT,
    why: 'Asks how far loyalty goes.',
    note: (v) => agree(v, 'I think I should stand by my family or group even when they are in the wrong.', 'I am torn on standing by my family or group when they are in the wrong.', 'I don’t think I should stand by my family or group when they are in the wrong.'),
  },
  {
    id: 'MF3', nodeId: 'fairness', stability: 'St', type: 'slider', fileIds: [F.mFair], selfTags: ['fairness'],
    text: 'How much responsibility do you have toward people outside your family or community?',
    scale: ['None', 'A great deal'],
    why: 'Asks how far your sense of responsibility reaches.',
    note: (v) =>
      tenPoint(
        v,
        `I feel a lot of responsibility toward people outside my family or community (${v}/10).`,
        `I feel some responsibility toward people outside my family or community (${v}/10).`,
        `I feel little responsibility toward people outside my family or community (${v}/10).`,
      ),
  },
  {
    id: 'MD1', nodeId: 'family', stability: 'St', type: 'choice', fileIds: [F.mFamily], selfTags: ['filial'],
    text: 'What I do for my parents comes mostly from:',
    options: [
      { value: 'love', label: 'Love' },
      { value: 'gratitude', label: 'Gratitude' },
      { value: 'duty', label: 'Duty' },
      { value: 'expect', label: 'What others expect' },
    ],
    source: 'informed', sourceNote: FILIAL,
    why: 'The same duty can come from different places.',
    note: pick({
      love: 'What I do for my parents comes mostly from love.',
      gratitude: 'What I do for my parents comes mostly from gratitude.',
      duty: 'What I do for my parents comes mostly from a sense of duty.',
      expect: 'What I do for my parents comes mostly from what others expect.',
    }),
  },
  {
    id: 'MD2', nodeId: 'family', stability: 'St', type: 'likert', fileIds: [F.mFamily], selfTags: ['filial'],
    text: 'Children should go along with their parents’ wishes on major life decisions, even when they disagree.',
    source: 'informed', sourceNote: FILIAL,
    why: 'Asks who has the final say on the big decisions.',
    note: (v) => agree(v, 'On major life decisions, I think children should go along with their parents’ wishes even when they disagree.', 'I am unsure whether children should follow their parents’ wishes on major life decisions.', 'On major life decisions, I think children can go against their parents’ wishes.'),
  },
  {
    id: 'MD3', nodeId: 'family', stability: 'Fl', type: 'text', fileIds: [F.mFamily], selfTags: ['filial-limits'],
    text: 'Is there a limit to what you owe your family? Where would you draw it?',
    placeholder: 'e.g. Not giving up my career, but being there for the big moments.',
    why: 'Naming the limit makes later trade-offs clearer.',
    note: quote('Where what I owe my family stops'),
  },

  // ── Monthly check-in (log) ──────────────────────────────────
  {
    id: 'C1', nodeId: 'checkin', stability: 'Fl', type: 'choice', fileIds: [F.log], selfTags: ['checkin'], log: true,
    text: 'Which area got most of your time this month?',
    options: LIFE_AREAS,
    why: 'Compared with the order you gave in Personal Priorities.',
    note: (v) => (v ? `Most of my time went to ${lower(optionLabel(LIFE_AREAS, v))}.` : ''),
  },
  {
    id: 'C2', nodeId: 'checkin', stability: 'Fl', type: 'slider', fileIds: [F.log], selfTags: ['checkin'], log: true,
    text: 'How well did your time match your priorities?',
    scale: ['Not at all', 'Completely'],
    why: 'A quick check of whether the month matched what you said matters.',
    note: (v) => tenPoint(v, `My time matched my priorities well (${v}/10).`, `My time partly matched my priorities (${v}/10).`, `My time did not match my priorities (${v}/10).`),
  },
  {
    id: 'C3', nodeId: 'checkin', stability: 'Fl', type: 'slider', fileIds: [F.log], selfTags: ['checkin'], log: true,
    text: 'How close do you feel to the person you want to be?',
    scale: ['Far', 'Very close'],
    why: 'Tracked month to month, not judged.',
    note: (v) => tenPoint(v, `I felt close to the person I want to be (${v}/10).`, `I felt somewhat close to the person I want to be (${v}/10).`, `I felt far from the person I want to be (${v}/10).`),
  },
  {
    id: 'C4', nodeId: 'checkin', stability: 'Fl', type: 'text', fileIds: [F.log], selfTags: ['checkin'], log: true,
    text: 'Did anything change this month? Optional.',
    placeholder: 'e.g. Started a new job; saw my grandparents twice.',
    why: 'One line is enough. It is kept with the date.',
    note: quote('What changed'),
  },
];

export const QUESTIONS: Question[] = items.map(({ stability, source, sourceNote, ...q }) => ({
  ...q,
  stability: stability === 'St' ? 'stable' : 'flexible',
  source: source ?? 'new',
  sourceNote: sourceNote ?? OWN,
}));

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

export function questionsForNode(nodeId: string): Question[] {
  return QUESTIONS.filter((q) => q.nodeId === nodeId);
}

/** A question is shown unless its gate (`showIf`) says otherwise. */
export function isShown(q: Question, responses: Record<string, Response>): boolean {
  return !q.showIf || q.showIf(responses);
}

export function formatAnswer(q: Question, v: AnswerValue): string {
  switch (q.type) {
    case 'likert': {
      const n = Number(v);
      return `${n}/5 — ${LIKERT_LABELS[n - 1] ?? ''}`;
    }
    case 'slider':
      return `${v}/10`;
    case 'choice':
      return optionLabel(q.options ?? [], v);
    case 'multi':
      return (Array.isArray(v) ? v : []).map((x) => optionLabel(q.options ?? [], x)).join(', ');
    case 'rank':
      return (Array.isArray(v) ? v : [])
        .map((x, i) => `${i + 1}. ${optionLabel(q.options ?? [], x)}`)
        .join('  ');
    case 'sliders': {
      const r = (v ?? {}) as Record<string, number>;
      return (q.sliders ?? []).filter((s) => r[s.value] !== undefined).map((s) => `${s.label} ${r[s.value]}/10`).join(', ');
    }
    case 'project': {
      const p = v as ProjectAnswer;
      const c = p.ratings?.control;
      return c === undefined ? p.text : `${p.text} — ${c}/10 in my control`;
    }
    default:
      return String(v);
  }
}

/** Short form used in "then and now" (old → new). */
export function shortAnswer(q: Question, v: AnswerValue): string {
  if (q.type === 'rank') {
    return (Array.isArray(v) ? v : []).slice(0, 3).map((x) => optionLabel(q.options ?? [], x)).join(' › ');
  }
  const s = formatAnswer(q, v);
  return s.length > 80 ? `${s.slice(0, 77).trimEnd()}…` : s;
}
