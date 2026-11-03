import type { GraphNode } from '../types';

export const ROOT_ID = 'root';
/** Tag activated by completing onboarding + preliminary consent. */
export const ONBOARDED_TAG = 'onboarded';

// Structure follows the prototype writeup (Doc 2): three branches under the root,
// and a Family Relationships node reached from both Ethics (E4) and Goals (G4).
export const NODES: GraphNode[] = [
  {
    id: 'root',
    name: 'Who am I?',
    tag: 'self',
    branch: 'root',
    description:
      'Explains what is stored and how, and asks for consent before any question is shown.',
    parentTags: [],
  },
  // ── Branches ───────────────────────────────────────────────
  {
    id: 'ethics',
    name: 'Ethics',
    tag: 'ethics',
    branch: 'ethics',
    description:
      'How much you weigh avoiding harm, and whether you think moral rules hold everywhere or depend on the situation.',
    parentTags: ['onboarded'],
    fileId: 'ethics/main',
  },
  {
    id: 'worldview',
    name: 'Worldview / Beliefs',
    tag: 'worldview',
    branch: 'worldview',
    description:
      'What you believe about how life works: how much of it is up to you, how you decide what is true, and what you owe people outside your circle.',
    parentTags: ['onboarded'],
    fileId: 'worldview/main',
  },
  {
    id: 'goals',
    name: 'Long-term Goals',
    tag: 'goals',
    branch: 'goals',
    description:
      'What you are working on, what you hope for, and how much each matters to you. Most of these answers are expected to change.',
    parentTags: ['onboarded'],
    fileId: 'long-term-goals/main',
  },
  // ── Ethics ─────────────────────────────────────────────────
  {
    id: 'moral',
    name: 'Moral Principles',
    tag: 'moral-principles',
    branch: 'ethics',
    description:
      'More statements about avoiding harm and about whether moral rules are universal, paraphrased from the Ethics Position Questionnaire.',
    parentTags: ['idealism', 'relativism', 'moral-principles'],
    fileId: 'ethics/moral-principles',
  },
  {
    id: 'family',
    name: 'Family Relationships',
    tag: 'family-duty',
    branch: 'ethics',
    description:
      'What you feel you owe parents and family, and where that stops.',
    parentTags: ['family-duty', 'relationships'],
    fileId: 'ethics/family-obligations',
  },
  {
    id: 'tradeoffs',
    name: 'Care vs Ambition',
    tag: 'tradeoff',
    branch: 'ethics',
    description:
      'What you would do when family and an opportunity pull in different directions.',
    parentTags: ['filial-limits', 'project-cost'],
    fileId: 'ethics/family-obligations',
  },
  // ── Worldview ──────────────────────────────────────────────
  {
    id: 'agency',
    name: 'Personal Agency',
    tag: 'personal-agency',
    branch: 'worldview',
    description:
      'Pairs of statements about control over your life, in the forced-choice style of Rotter’s locus-of-control scale.',
    parentTags: ['personal-agency'],
    fileId: 'worldview/personal-agency',
  },
  {
    id: 'meaning',
    name: 'Meaning in Life',
    tag: 'purpose',
    branch: 'worldview',
    description:
      'Whether your life feels meaningful now, and whether you are looking for more meaning.',
    parentTags: ['purpose', 'aspiration-tradeoff'],
    fileId: 'worldview/main',
  },
  // ── Long-term goals ────────────────────────────────────────
  {
    id: 'projects',
    name: 'Personal Projects',
    tag: 'career',
    branch: 'goals',
    description:
      'A closer look at the project you described: how it feels, how it is going, and what it costs you.',
    parentTags: ['career'],
    fileId: 'long-term-goals/career',
  },
  {
    id: 'aspirations',
    name: 'Aspirations',
    tag: 'aspirations',
    branch: 'goals',
    description:
      'How likely the things you rated as important are to happen, and which you would give up first.',
    parentTags: ['aspirations'],
    fileId: 'long-term-goals/main',
  },
];

export const NODE_BY_ID: Record<string, GraphNode> = Object.fromEntries(
  NODES.map((n) => [n.id, n]),
);
