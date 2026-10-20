import type { GraphNode } from '../types';

export const ROOT_ID = 'root';
/** Tag activated by completing onboarding + preliminary consent. */
export const ONBOARDED_TAG = 'onboarded';

export const NODES: GraphNode[] = [
  {
    id: 'root',
    name: 'Who am I?',
    tag: 'self',
    branch: 'root',
    description:
      'The starting point. Explains what this system does, what it stores, and asks for preliminary consent before anything is recorded.',
    parentTags: [],
  },
  // ── Branches ───────────────────────────────────────────────
  {
    id: 'ethics',
    name: 'Ethics',
    tag: 'ethics',
    branch: 'ethics',
    description:
      'How you weigh harm and outcomes, and whether you think moral principles hold universally or depend on circumstances (idealism and relativism).',
    parentTags: ['onboarded'],
    fileId: 'ethics/main',
  },
  {
    id: 'worldview',
    name: 'Worldview / Beliefs',
    tag: 'worldview',
    branch: 'worldview',
    description:
      'Exploratory questions about personal agency, where your knowledge comes from, and what you owe other people. Not a validated worldview scale.',
    parentTags: ['onboarded'],
    fileId: 'worldview/main',
  },
  {
    id: 'goals',
    name: 'Long-term Goals',
    tag: 'goals',
    branch: 'goals',
    description:
      'A long-term goal in your own words, how important it is, why it matters, and what pursuing it would ask of you.',
    parentTags: ['onboarded'],
    fileId: 'long-term-goals/main',
  },
  // ── Ethics descendants ─────────────────────────────────────
  {
    id: 'eth-harm',
    name: 'Harm & Consequences',
    tag: 'harm-concern',
    branch: 'ethics',
    description:
      'Explores how much outcomes matter to you compared with rules and intentions, and whether you feel responsible for harms you fail to prevent.',
    parentTags: ['idealism'],
    fileId: 'ethics/moral-principles',
  },
  {
    id: 'eth-universal',
    name: 'Universal vs Contextual Principles',
    tag: 'relativism',
    branch: 'ethics',
    description:
      'Explores whether you think the same moral rules should bind everyone, or whether context and culture change what is right.',
    parentTags: ['relativism'],
    fileId: 'ethics/moral-principles',
  },
  {
    id: 'eth-family',
    name: 'Obligations to Elders & Family',
    tag: 'family-duty',
    branch: 'ethics',
    description:
      'A deeper look at what you believe you owe parents, grandparents and family — and where you think those obligations reach their limits.',
    parentTags: ['family-duty'],
    fileId: 'ethics/family-obligations',
  },
  {
    id: 'eth-tradeoffs',
    name: 'Care vs Ambition Trade-offs',
    tag: 'tradeoff',
    branch: 'ethics',
    description:
      'Reached from both family obligations and career direction. Explores how you would act when caring for family and pursuing an opportunity pull apart.',
    parentTags: ['eldercare-limits', 'relocation'],
    fileId: 'ethics/family-obligations',
  },
  // ── Worldview descendants ──────────────────────────────────
  {
    id: 'wv-agency',
    name: 'Personal Agency',
    tag: 'agency',
    branch: 'worldview',
    description:
      'How much of your life you see as shaped by your own choices versus luck, circumstance and other people.',
    parentTags: ['agency'],
    fileId: 'worldview/personal-agency',
  },
  {
    id: 'wv-knowledge',
    name: 'Sources of Knowledge',
    tag: 'epistemic',
    branch: 'worldview',
    description:
      'Which sources you trust when forming beliefs, how you handle uncertainty, and how you respond to evidence against your views.',
    parentTags: ['epistemic'],
    fileId: 'worldview/sources-of-knowledge',
  },
  {
    id: 'wv-others',
    name: 'Obligations to Others',
    tag: 'others-obligation',
    branch: 'worldview',
    description:
      'Reached from worldview and from harm sensitivity. Explores whose wellbeing you think should count, and how much you owe strangers.',
    parentTags: ['others-obligation', 'harm-sensitivity'],
    fileId: 'worldview/obligations-to-others',
  },
  {
    id: 'wv-meaning',
    name: 'Meaning & Purpose',
    tag: 'meaning',
    branch: 'worldview',
    description:
      'Reached from agency and from goals-values alignment. What would make your life feel well-used, and whether your daily work connects to it.',
    parentTags: ['meaning'],
    fileId: 'worldview/main',
  },
  // ── Goals descendants ──────────────────────────────────────
  {
    id: 'goal-career',
    name: 'Career Direction',
    tag: 'career-goal',
    branch: 'goals',
    description:
      'The work you want to be doing in ten years, what you want from it, and what you would be willing to change to get there.',
    parentTags: ['career-goal'],
    fileId: 'long-term-goals/career',
  },
  {
    id: 'goal-rel',
    name: 'Relationships & Home',
    tag: 'relational-goal',
    branch: 'goals',
    description:
      'Reached from goals and from family obligations. What you want your relationships with family to look like, and where you want to live.',
    parentTags: ['relational-goal', 'eldercare'],
    fileId: 'long-term-goals/relationships',
  },
  {
    id: 'goal-values',
    name: 'Goals ↔ Values',
    tag: 'value-alignment',
    branch: 'goals',
    description:
      'A deeper question: which of your values your goal expresses, and where it pulls against something else you care about.',
    parentTags: ['goal-why'],
    fileId: 'long-term-goals/main',
  },
];

export const NODE_BY_ID: Record<string, GraphNode> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
);
