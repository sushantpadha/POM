import type { GraphNode } from '../types';

export const ROOT_ID = 'root';
/** Tag activated by completing onboarding + preliminary consent. */
export const ONBOARDED_TAG = 'onboarded';
/** Marked "Start here" on the map until it has an answer. */
export const START_HERE = 'priorities';

// Five branches under the root (PLAN_V2.md 2.3). Deeper nodes open when ANY parent tag is active.
export const NODES: GraphNode[] = [
  {
    id: 'root',
    name: 'Who am I?',
    tag: 'self',
    branch: 'root',
    description: 'Explains what is stored and how, and asks for consent before any question is shown.',
    parentTags: [],
  },
  // ── Personal Priorities ────────────────────────────────────
  {
    id: 'priorities',
    name: 'Personal Priorities',
    tag: 'priorities',
    branch: 'priorities',
    description: 'What usually wins when the things you want clash, and where you want your attention to go. Start here: it settles most later trade-offs.',
    parentTags: ['onboarded'],
    fileId: 'priorities/main',
  },
  {
    id: 'trades',
    name: 'What I’d Trade',
    tag: 'trade',
    branch: 'priorities',
    description: 'Three plain either-or choices: money or time, stability or change, people or opportunities.',
    parentTags: ['values', 'money'],
    fileId: 'priorities/trade-offs',
  },
  {
    id: 'clashes',
    name: 'When Priorities Clash',
    tag: 'tradeoff',
    branch: 'priorities',
    description: 'A concrete clash between family and an opportunity, and the conditions under which a lower priority would win. Opened from Priorities, Family Duty or Work & Study.',
    parentTags: ['priority', 'filial-limits', 'work-cost'],
    fileId: 'priorities/trade-offs',
  },
  {
    id: 'checkin',
    name: 'Monthly Check-in',
    tag: 'checkin',
    branch: 'root',
    description: 'Four quick questions, about a minute, once a month: where your time went and how close you feel to the person you want to be. Each check-in is kept with its date.',
    parentTags: ['life-areas'],
    fileId: 'check-ins/log',
  },
  // ── Goals & Aspirations ────────────────────────────────────
  {
    id: 'goals',
    name: 'Goals & Aspirations',
    tag: 'goals',
    branch: 'goals',
    description: 'What you are working toward now, what an ordinary good day five years from now looks like, and what you want in your life by then.',
    parentTags: ['onboarded'],
    fileId: 'goals/main',
  },
  {
    id: 'career',
    name: 'Work & Study Path',
    tag: 'career',
    branch: 'goals',
    description: 'How settled your work or study direction is. If it is worth exploring, the paths you are weighing and a cheap way to test one.',
    parentTags: ['career'],
    fileId: 'goals/work-and-study',
  },
  {
    id: 'home',
    name: 'Relationships & Home',
    tag: 'home',
    branch: 'goals',
    description: 'Where and with whom you want to live, and the scenarios when that depends on someone else.',
    parentTags: ['relationships', 'future'],
    fileId: 'goals/relationships-and-home',
  },
  {
    id: 'more',
    name: 'Other Areas',
    tag: 'more',
    branch: 'goals',
    description: 'One short question for each area you picked: money, ageing parents, health, or starting something of your own.',
    parentTags: ['more-areas'],
    fileId: 'goals/main',
  },
  // ── Identity & Self-concept ────────────────────────────────
  {
    id: 'identity',
    name: 'Identity & Self-concept',
    tag: 'identity',
    branch: 'identity',
    description: 'How you would describe yourself: three words, your strengths, the roles that matter to you.',
    parentTags: ['onboarded'],
    fileId: 'identity/main',
  },
  {
    id: 'tendencies',
    name: 'How I Tend to Be',
    tag: 'tendency',
    branch: 'identity',
    description: 'Five quick statements about how you usually act. Not a personality test, and nothing is scored.',
    parentTags: ['self-image', 'clarity'],
    fileId: 'identity/tendencies',
  },
  {
    id: 'becoming',
    name: 'Who I Want to Be',
    tag: 'becoming',
    branch: 'identity',
    description: 'When you feel most like yourself, something you want to get better at, and whether others see you as you do.',
    parentTags: ['strengths', 'roles'],
    fileId: 'identity/becoming',
  },
  // ── Worldview & Beliefs ────────────────────────────────────
  {
    id: 'worldview',
    name: 'Worldview & Beliefs',
    tag: 'worldview',
    branch: 'worldview',
    description: 'What you believe about how life works: choices or luck, whether people can be trusted, whether the world is mostly good.',
    parentTags: ['onboarded'],
    fileId: 'worldview/main',
  },
  {
    id: 'control',
    name: 'Control & Change',
    tag: 'agency-belief',
    branch: 'worldview',
    description: 'How much of getting ahead is effort, whether people can change, and a recent success: how much was you.',
    parentTags: ['agency'],
    fileId: 'worldview/control-and-change',
  },
  {
    id: 'society',
    name: 'People & Belief',
    tag: 'society',
    branch: 'worldview',
    description: 'What shapes people, what makes relationships last, the place of faith, and where you differ from those around you.',
    parentTags: ['trust', 'world'],
    fileId: 'worldview/people-and-belief',
  },
  // ── Moral Principles ───────────────────────────────────────
  {
    id: 'moral',
    name: 'Moral Principles',
    tag: 'moral',
    branch: 'moral',
    description: 'Small situations about loyalty and honesty, what counts when you judge right and wrong, and what you owe your parents.',
    parentTags: ['onboarded'],
    fileId: 'moral/main',
  },
  {
    id: 'rules',
    name: 'Rules & Exceptions',
    tag: 'rules',
    branch: 'moral',
    description: 'Whether doing right can mean someone gets hurt, when a promise can be broken, and what you would never do.',
    parentTags: ['honesty', 'judging', 'relativism'],
    fileId: 'moral/rules-and-exceptions',
  },
  {
    id: 'fairness',
    name: 'Fairness & Loyalty',
    tag: 'fairness',
    branch: 'moral',
    description: 'What a fair split is, how far loyalty goes, and how far your responsibility reaches.',
    parentTags: ['loyalty'],
    fileId: 'moral/fairness-and-loyalty',
  },
  {
    id: 'family',
    name: 'Family Duty',
    tag: 'filial',
    branch: 'moral',
    description: 'Where what you do for your parents comes from, who decides the big things, and where your duty stops. Opened from Moral Principles and from Goals.',
    parentTags: ['family-duty', 'relationships'],
    fileId: 'moral/family-duty',
  },
];

export const NODE_BY_ID: Record<string, GraphNode> = Object.fromEntries(NODES.map((n) => [n.id, n]));

/** The five branch nodes, in tree order. */
export const BRANCH_NODES = ['worldview', 'moral', 'priorities', 'identity', 'goals'];
