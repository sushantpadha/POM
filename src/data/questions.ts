import type { AnswerValue, Option, ProjectAnswer, Question } from '../types';

// Branch items (E1–E5, W1–W5, G1–G5) are taken from the prototype writeup (Doc 2),
// wording unchanged. Deeper items are our paraphrases of the instruments the
// writeups cite. "Adapted" items are paraphrased, never the original wording, and
// no instrument is administered in full, so nothing here produces a score.

export const LIKERT_LABELS = ['Strongly disagree', 'Disagree', 'Neither', 'Agree', 'Strongly agree'];

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

function ranked(options: Option[], v: AnswerValue, take = 2): string {
  const order = Array.isArray(v) ? v : [];
  return order
    .slice(0, take)
    .map((x) => optionLabel(options, x).toLowerCase())
    .join(', then ');
}

const quote = (prefix: string) => (v: AnswerValue) => `${prefix} “${String(v).trim()}”`;

function ratingList(sliders: Option[], v: AnswerValue): string {
  const r = (v ?? {}) as Record<string, number>;
  return sliders
    .filter((s) => r[s.value] !== undefined)
    .map((s) => `${s.label.toLowerCase()} ${r[s.value]}/10`)
    .join(', ');
}

const E5_OPTS: Option[] = [
  { value: 'consequences', label: 'Its consequences' },
  { value: 'rule', label: 'A rule or principle' },
  { value: 'intentions', label: 'The intentions behind it' },
  { value: 'fairness', label: 'Fairness to everyone' },
];

const W2_OPTS: Option[] = [
  { value: 'experts', label: 'Experts' },
  { value: 'experience', label: 'Experience' },
  { value: 'tradition', label: 'Family / tradition' },
  { value: 'intuition', label: 'Intuition' },
  { value: 'texts', label: 'Texts' },
];

const ASPIRATIONS: Option[] = [
  { value: 'wealth', label: 'Financial success' },
  { value: 'relationships', label: 'Close relationships' },
  { value: 'growth', label: 'Personal growth' },
  { value: 'recognition', label: 'Recognition' },
  { value: 'community', label: 'Community' },
];

const G5_OPTS: Option[] = [
  { value: 'career', label: 'Career & work' },
  { value: 'family', label: 'Family & relationships' },
  { value: 'health', label: 'Health' },
  { value: 'learning', label: 'Learning' },
  { value: 'community', label: 'Community' },
];

const PROJECT_SLIDERS: Option[] = [
  { value: 'importance', label: 'Importance' },
  { value: 'control', label: 'Control' },
];

const PROJECT_APPRAISAL: Option[] = [
  { value: 'enjoyment', label: 'Enjoyment' },
  { value: 'stress', label: 'Stress' },
  { value: 'progress', label: 'Progress so far' },
  { value: 'fit', label: 'Personal fit' },
];

const EPQ = 'Ethics Position Questionnaire (EPQ-5), Forsyth.';
const ROTTER = 'Locus-of-control scale (Rotter, 1966), forced-choice format.';
const MLQ = 'Meaning in Life Questionnaire (Steger et al., 2006).';
const PPA = 'Personal Projects Analysis (Little, 1983).';
const AI = 'Aspiration Index (Kasser & Ryan, 1996).';
const FILIAL = 'Dual filial piety model (Yeh & Bedford, 2003).';

export const QUESTIONS: Question[] = [
  // ── Ethics (Doc 2: E1–E5) ──────────────────────────────────
  {
    id: 'E1',
    nodeId: 'ethics',
    // Wording from the UI summary (Nov 2026), replacing Doc 2's "least harm for everyone involved".
    text: 'If an action could harm an innocent other, then it should not be done.',
    type: 'likert',
    selfTags: ['idealism'],
    fileIds: ['ethics/moral-principles'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: EPQ,
    note: (v) =>
      agree(
        v,
        'If an action could harm an innocent person, I think it should not be done.',
        'I am unsure whether a risk of harm to an innocent person always rules an action out.',
        'A risk of harm to an innocent person does not always rule an action out for me.',
      ),
  },
  {
    id: 'E2',
    nodeId: 'ethics',
    text: 'What is ethical depends on the situation and culture; no rule applies everywhere.',
    type: 'likert',
    selfTags: ['relativism'],
    fileIds: ['ethics/moral-principles'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: EPQ,
    note: (v) =>
      agree(
        v,
        'I think what is ethical depends on the situation and culture.',
        'I am undecided on whether ethics depends on the situation and culture.',
        'I think some moral rules apply everywhere.',
      ),
  },
  {
    id: 'E3',
    nodeId: 'ethics',
    text: 'Would you break a promise to prevent minor harm to a stranger? Why or why not?',
    type: 'text',
    selfTags: ['moral-principles'],
    fileIds: ['ethics/moral-principles'],
    stability: 'stable',
    source: 'new',
    sourceNote: 'Our own question.',
    note: quote('Promise vs. minor harm:'),
  },
  {
    id: 'E4',
    nodeId: 'ethics',
    text: 'How much do you feel you owe your elders in time, money or career decisions?',
    type: 'slider',
    scale: ['Nothing in particular', 'A great deal'],
    selfTags: ['family-duty'],
    fileIds: ['ethics/family-obligations'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    askConfidence: true,
    note: (v) =>
      `What I owe my elders in time, money or career decisions: ${v}/10 — ${tenPoint(v, 'a lot', 'some', 'not much')}.`,
  },
  {
    id: 'E5',
    nodeId: 'ethics',
    text: 'What matters most when you judge whether an action was right: its consequences, a rule or principle, the intentions behind it, or fairness to everyone?',
    help: 'Put the most important first.',
    type: 'rank',
    options: E5_OPTS,
    selfTags: ['idealism'],
    fileIds: ['ethics/moral-principles'],
    stability: 'stable',
    source: 'informed',
    sourceNote: 'Our own question, informed by moral psychology (consequences vs. rules vs. intentions).',
    note: (v) => `When I judge an action I look first at ${ranked(E5_OPTS, v)}.`,
  },
  // ── Moral Principles (EPQ-5, paraphrased) ──────────────────
  {
    id: 'MP1',
    nodeId: 'moral',
    text: 'It is never acceptable to risk harming another person, however small the risk.',
    type: 'likert',
    selfTags: ['idealism'],
    fileIds: ['ethics/moral-principles'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: `${EPQ} Idealism.`,
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'Risking harm to another person is never acceptable to me, even a small risk.',
        'I am unsure whether small risks of harm to others can be acceptable.',
        'Small risks of harm to others can be acceptable to me.',
      ),
  },
  {
    id: 'MP2',
    nodeId: 'moral',
    text: 'Doing the right thing sometimes means accepting that someone will be hurt.',
    type: 'likert',
    selfTags: ['idealism'],
    fileIds: ['ethics/moral-principles'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: `${EPQ} Idealism, reverse-worded.`,
    note: (v) =>
      agree(
        v,
        'Doing the right thing can mean accepting that someone gets hurt.',
        'I am unsure whether doing right can justify someone getting hurt.',
        'Doing the right thing should not mean someone gets hurt.',
      ),
  },
  {
    id: 'MP3',
    nodeId: 'moral',
    text: 'Whether a lie is wrong depends on the circumstances around it.',
    type: 'likert',
    selfTags: ['relativism'],
    fileIds: ['ethics/moral-principles'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: `${EPQ} Relativism.`,
    note: (v) =>
      agree(
        v,
        'Whether a lie is wrong depends on the circumstances.',
        'I am unsure whether circumstances change whether a lie is wrong.',
        'Lying is wrong whatever the circumstances.',
      ),
  },
  {
    id: 'MP4',
    nodeId: 'moral',
    text: 'Moral standards are personal: what one person thinks is right, another can reasonably think is wrong.',
    type: 'likert',
    selfTags: ['relativism'],
    fileIds: ['ethics/moral-principles'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: `${EPQ} Relativism.`,
    note: (v) =>
      agree(
        v,
        'I see moral standards as personal; reasonable people can disagree.',
        'I am unsure whether moral standards are personal.',
        'I think moral standards are shared, not just personal.',
      ),
  },
  // ── Family Relationships ───────────────────────────────────
  {
    id: 'FR1',
    nodeId: 'family',
    text: 'I want to support my parents later in life because of what they have given me.',
    type: 'likert',
    selfTags: ['filial'],
    fileIds: ['ethics/family-obligations'],
    stability: 'stable',
    source: 'informed',
    sourceNote: `Our wording, informed by the reciprocal side of the ${FILIAL}`,
    note: (v) =>
      agree(
        v,
        'I want to support my parents later in life because of what they have given me.',
        'I am unsure how much I want to support my parents later in life.',
        'Supporting my parents later in life is not something I feel strongly about.',
      ),
  },
  {
    id: 'FR2',
    nodeId: 'family',
    text: 'Children should go along with their parents’ wishes on major life decisions, even when they disagree.',
    type: 'likert',
    selfTags: ['filial'],
    fileIds: ['ethics/family-obligations'],
    stability: 'stable',
    source: 'informed',
    sourceNote: `Our wording, informed by the authoritarian side of the ${FILIAL}`,
    note: (v) =>
      agree(
        v,
        'On major decisions, I think children should follow their parents’ wishes even when they disagree.',
        'I am unsure whether children should follow their parents’ wishes on major decisions.',
        'On major decisions, I think children can go against their parents’ wishes.',
      ),
  },
  {
    id: 'FR3',
    nodeId: 'family',
    text: 'Is there a limit to what you owe your family? Where would you draw it?',
    type: 'text',
    selfTags: ['filial-limits'],
    fileIds: ['ethics/family-obligations'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    askConfidence: true,
    note: quote('Where the obligation stops:'),
  },
  // ── Care vs Ambition ───────────────────────────────────────
  {
    id: 'CA1',
    nodeId: 'tradeoffs',
    text: 'If an important opportunity meant seeing your family much less for several years, you would most likely…',
    type: 'choice',
    options: [
      { value: 'take', label: 'Take it, with a plan for staying involved' },
      { value: 'negotiate', label: 'Try to get a smaller or shorter version' },
      { value: 'decline', label: 'Turn it down' },
      { value: 'unsure', label: 'I don’t know' },
    ],
    selfTags: ['tradeoff'],
    fileIds: ['ethics/family-obligations'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    askConfidence: true,
    note: (v) =>
      `Facing an opportunity that means seeing family much less, I would most likely ${({ take: 'take it, with a plan for staying involved', negotiate: 'try to get a smaller or shorter version', decline: 'turn it down', unsure: '— I don’t know' } as Record<string, string>)[String(v)] ?? v}.`,
  },
  {
    id: 'CA2',
    nodeId: 'tradeoffs',
    text: 'What would need to be true for you to be at peace with that choice?',
    type: 'text',
    selfTags: ['tradeoff'],
    fileIds: ['ethics/family-obligations'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    note: quote('To be at peace with it:'),
  },
  // ── Worldview (Doc 2: W1–W5) ───────────────────────────────
  {
    id: 'W1',
    nodeId: 'worldview',
    text: 'My own choices matter more than luck or circumstances in shaping my life.',
    type: 'likert',
    selfTags: ['personal-agency'],
    fileIds: ['worldview/personal-agency'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: 'Adapted from the locus-of-control construct (Rotter, 1966).',
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'My own choices matter more than luck or circumstances in shaping my life.',
        'I give my choices and my circumstances roughly equal weight.',
        'Luck and circumstances shape my life more than my choices.',
      ),
  },
  {
    id: 'W2',
    nodeId: 'worldview',
    text: 'When I need to decide what is true, I mostly rely on experts, experience, family or tradition, intuition, or texts.',
    help: 'Put what you rely on most first.',
    type: 'rank',
    options: W2_OPTS,
    selfTags: ['sources-of-knowledge'],
    fileIds: ['worldview/sources-of-knowledge'],
    stability: 'stable',
    source: 'new',
    sourceNote: 'Our own question.',
    note: (v) => `To decide what is true I rely most on ${ranked(W2_OPTS, v)}.`,
  },
  {
    id: 'W3',
    nodeId: 'worldview',
    text: 'How much responsibility do you have toward people outside your family or community?',
    type: 'slider',
    scale: ['None', 'A great deal'],
    selfTags: ['obligations-to-others'],
    fileIds: ['worldview/obligations-to-others'],
    stability: 'stable',
    source: 'new',
    sourceNote: 'Our own question.',
    note: (v) => `My responsibility toward people outside my family or community: ${v}/10.`,
  },
  {
    id: 'W4',
    nodeId: 'worldview',
    text: 'Name one belief you’ve changed in the last two years.',
    type: 'text',
    selfTags: ['worldview'],
    fileIds: ['worldview/main'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    note: quote('A belief I changed:'),
  },
  {
    id: 'W5',
    nodeId: 'worldview',
    text: 'In a sentence: what would make your life feel well used?',
    type: 'text',
    // Doc 2 tags W5 as #epistemic; it asks about purpose, so it is tagged #purpose here.
    selfTags: ['purpose'],
    fileIds: ['worldview/main'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    note: quote('A life well used:'),
  },
  // ── Personal Agency (Rotter-style forced choice, paraphrased) ──
  {
    id: 'PA1',
    nodeId: 'agency',
    text: 'Which statement is closer to what you believe?',
    type: 'choice',
    options: [
      { value: 'internal', label: 'Getting ahead mostly depends on effort and ability.' },
      { value: 'external', label: 'Getting ahead mostly depends on being in the right place at the right time.' },
    ],
    selfTags: ['agency-belief'],
    fileIds: ['worldview/personal-agency'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: ROTTER,
    note: (v) =>
      v === 'internal'
        ? 'Getting ahead mostly depends on effort and ability.'
        : 'Getting ahead mostly depends on being in the right place at the right time.',
  },
  {
    id: 'PA2',
    nodeId: 'agency',
    text: 'Which statement is closer to what you believe?',
    type: 'choice',
    options: [
      { value: 'internal', label: 'What happens to me is mostly my own doing.' },
      { value: 'external', label: 'I often have little influence over what happens to me.' },
    ],
    selfTags: ['agency-belief'],
    fileIds: ['worldview/personal-agency'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: ROTTER,
    note: (v) =>
      v === 'internal'
        ? 'What happens to me is mostly my own doing.'
        : 'I often have little influence over what happens to me.',
  },
  {
    id: 'PA3',
    nodeId: 'agency',
    text: 'Think of something that went well recently. How much of it was you, and how much was luck or help?',
    type: 'text',
    selfTags: ['agency-belief'],
    fileIds: ['worldview/personal-agency'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    note: quote('Something that went well:'),
  },
  // ── Meaning in Life (MLQ, paraphrased) ─────────────────────
  {
    id: 'ML1',
    nodeId: 'meaning',
    text: 'I have a clear sense of what makes my life meaningful.',
    type: 'likert',
    selfTags: ['meaning'],
    fileIds: ['worldview/main'],
    stability: 'flexible',
    source: 'adapted',
    sourceNote: `${MLQ} Presence of meaning.`,
    askConfidence: true,
    note: (v) =>
      agree(
        v,
        'I have a clear sense of what makes my life meaningful.',
        'I have a partial sense of what makes my life meaningful.',
        'I don’t yet have a clear sense of what makes my life meaningful.',
      ),
  },
  {
    id: 'ML2',
    nodeId: 'meaning',
    text: 'My life has a clear direction.',
    type: 'likert',
    selfTags: ['meaning'],
    fileIds: ['worldview/main'],
    stability: 'flexible',
    source: 'adapted',
    sourceNote: `${MLQ} Presence of meaning.`,
    note: (v) => agree(v, 'My life has a clear direction.', 'My life has some direction.', 'My life doesn’t have a clear direction right now.'),
  },
  {
    id: 'ML3',
    nodeId: 'meaning',
    text: 'I am looking for something that would make my life feel more meaningful.',
    type: 'likert',
    selfTags: ['meaning'],
    fileIds: ['worldview/main'],
    stability: 'flexible',
    source: 'adapted',
    sourceNote: `${MLQ} Search for meaning.`,
    note: (v) =>
      agree(
        v,
        'I am looking for something that would make my life feel more meaningful.',
        'I am somewhat looking for more meaning.',
        'I am not actively looking for more meaning.',
      ),
  },
  // ── Long-term Goals (Doc 2: G1–G5) ─────────────────────────
  {
    id: 'G1',
    nodeId: 'goals',
    text: 'Describe one project you are working on. How important is it (0–10)? How much control do you have over it?',
    type: 'project',
    sliders: PROJECT_SLIDERS,
    selfTags: ['career'],
    fileIds: ['long-term-goals/career'],
    stability: 'flexible',
    source: 'adapted',
    sourceNote: `Adapted from ${PPA}`,
    note: (v) => {
      const p = v as ProjectAnswer;
      return `Project: ${p.text.trim()} (${ratingList(PROJECT_SLIDERS, p.ratings)})`;
    },
  },
  {
    id: 'G2',
    nodeId: 'goals',
    text: 'Picture yourself in 10 years, with things having gone well. What are you doing?',
    type: 'text',
    selfTags: ['career', 'relationships'],
    fileIds: ['long-term-goals/career', 'long-term-goals/relationships'],
    stability: 'flexible',
    source: 'adapted',
    sourceNote: 'Adapted from the Best Possible Self exercise (King, 2001).',
    note: quote('In ten years, if things go well:'),
  },
  {
    id: 'G3',
    nodeId: 'goals',
    text: 'Rate how important each is to you.',
    type: 'sliders',
    sliders: ASPIRATIONS,
    selfTags: ['aspirations'],
    fileIds: ['long-term-goals/main'],
    stability: 'stable',
    source: 'adapted',
    sourceNote: `Adapted from the ${AI}`,
    note: (v) => `Importance: ${ratingList(ASPIRATIONS, v)}.`,
  },
  {
    id: 'G4',
    nodeId: 'goals',
    text: 'What kind of family or relationship life do you want in the future?',
    type: 'text',
    selfTags: ['relationships'],
    fileIds: ['long-term-goals/relationships'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    note: quote('Family and relationship life I want:'),
  },
  {
    id: 'G5',
    nodeId: 'goals',
    text: 'Rank these areas by how much attention you want to give them over the next ten years.',
    help: 'Put what you want to give the most attention first.',
    type: 'rank',
    options: G5_OPTS,
    selfTags: ['relationships', 'career'],
    fileIds: ['long-term-goals/main'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    note: (v) => `Attention over the next ten years: ${ranked(G5_OPTS, v, 3)}.`,
  },
  // ── Personal Projects (PPA dimensions) ─────────────────────
  {
    id: 'PP1',
    nodeId: 'projects',
    text: 'Thinking of the project you described, rate each from 0 to 10.',
    type: 'sliders',
    sliders: PROJECT_APPRAISAL,
    selfTags: ['project-appraisal'],
    fileIds: ['long-term-goals/career'],
    stability: 'flexible',
    source: 'adapted',
    sourceNote: `Rating dimensions adapted from ${PPA}`,
    note: (v) => `About my project: ${ratingList(PROJECT_APPRAISAL, v)}.`,
  },
  {
    id: 'PP2',
    nodeId: 'projects',
    text: 'How much time with family or close people does this project ask you to give up?',
    type: 'slider',
    scale: ['None', 'A great deal'],
    selfTags: ['project-cost'],
    fileIds: ['long-term-goals/career'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    askConfidence: true,
    note: (v) => `Time with family or close people this project asks me to give up: ${v}/10.`,
  },
  // ── Aspirations (Aspiration Index, likelihood) ─────────────
  {
    id: 'AS1',
    nodeId: 'aspirations',
    text: 'How likely is each of these to happen for you?',
    type: 'sliders',
    sliders: ASPIRATIONS,
    selfTags: ['aspiration-likelihood'],
    fileIds: ['long-term-goals/main'],
    stability: 'flexible',
    source: 'adapted',
    sourceNote: `Likelihood ratings, adapted from the ${AI}`,
    note: (v) => `Likelihood: ${ratingList(ASPIRATIONS, v)}.`,
  },
  {
    id: 'AS2',
    nodeId: 'aspirations',
    text: 'If you had to give one of these up, which would it be?',
    type: 'choice',
    options: ASPIRATIONS,
    selfTags: ['aspiration-tradeoff'],
    fileIds: ['long-term-goals/main'],
    stability: 'flexible',
    source: 'new',
    sourceNote: 'Our own question.',
    note: (v) => `If I had to give one up: ${optionLabel(ASPIRATIONS, v).toLowerCase()}.`,
  },
];

// "Why we ask this" lines for the writeup items. Deeper items fall back to their source note.
const WHY: Record<string, string> = {
  E1: 'Asks how firmly you hold to not harming others.',
  E2: 'Asks whether you see moral rules as universal or as depending on context.',
  E3: 'A concrete case shows how you apply your principles.',
  E4: 'Family duties often shape big decisions. This answer can change as your life does.',
  E5: 'Shows what you look at first when you judge right and wrong.',
  W1: 'Asks how much of your life you see as in your own hands.',
  W2: 'Asks where you turn when you need to know what is true.',
  W3: 'Asks how far your sense of responsibility reaches.',
  W4: 'Beliefs change. Noticing one that did is part of reflecting.',
  W5: 'Puts what gives your life meaning into one sentence.',
  G1: 'A current project shows what you are working towards now.',
  G2: 'Imagining things going well helps you name what you want.',
  G3: 'Compares things people commonly hope for in life.',
  G4: 'Asks what you want from family and relationships later on.',
  G5: 'Shows where you want to put your attention.',
};
for (const q of QUESTIONS) q.why ??= WHY[q.id];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export function questionsForNode(nodeId: string): Question[] {
  return QUESTIONS.filter((q) => q.nodeId === nodeId);
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
    case 'rank':
      return (Array.isArray(v) ? v : [])
        .map((x, i) => `${i + 1}. ${optionLabel(q.options ?? [], x)}`)
        .join('  ');
    case 'sliders':
      return ratingList(q.sliders ?? [], v);
    case 'project': {
      const p = v as ProjectAnswer;
      return `${p.text} — ${ratingList(q.sliders ?? [], p.ratings)}`;
    }
    default:
      return String(v);
  }
}
