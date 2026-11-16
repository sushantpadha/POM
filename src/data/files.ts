import type { Branch, Dir, NoteFile } from '../types';

/** The knowledge-base layout. Filenames are conceptual, not literal file extensions. */
export const FILE_DEFS: Pick<NoteFile, 'id' | 'dir' | 'name' | 'title'>[] = [
  { id: 'check-ins/log', dir: 'check-ins', name: 'log', title: 'Monthly check-ins' },
  { id: 'worldview/main', dir: 'worldview', name: 'main', title: 'Worldview & beliefs' },
  { id: 'worldview/control-and-change', dir: 'worldview', name: 'control-and-change', title: 'Control and change' },
  { id: 'worldview/people-and-belief', dir: 'worldview', name: 'people-and-belief', title: 'People and belief' },
  { id: 'moral/main', dir: 'moral', name: 'main', title: 'Moral principles' },
  { id: 'moral/rules-and-exceptions', dir: 'moral', name: 'rules-and-exceptions', title: 'Rules and exceptions' },
  { id: 'moral/fairness-and-loyalty', dir: 'moral', name: 'fairness-and-loyalty', title: 'Fairness and loyalty' },
  { id: 'moral/family-duty', dir: 'moral', name: 'family-duty', title: 'Family duty' },
  { id: 'priorities/main', dir: 'priorities', name: 'main', title: 'Personal priorities' },
  { id: 'priorities/trade-offs', dir: 'priorities', name: 'trade-offs', title: 'Trade-offs' },
  { id: 'identity/main', dir: 'identity', name: 'main', title: 'Identity' },
  { id: 'identity/tendencies', dir: 'identity', name: 'tendencies', title: 'How I tend to be' },
  { id: 'identity/becoming', dir: 'identity', name: 'becoming', title: 'Who I want to be' },
  { id: 'goals/main', dir: 'goals', name: 'main', title: 'Goals & aspirations' },
  { id: 'goals/work-and-study', dir: 'goals', name: 'work-and-study', title: 'Work and study' },
  { id: 'goals/relationships-and-home', dir: 'goals', name: 'relationships-and-home', title: 'Relationships and home' },
];

export const FILE_DEF_BY_ID = Object.fromEntries(FILE_DEFS.map((f) => [f.id, f]));

/** Folder order in the tree. The check-in log sits at the top and has no branch colour. */
export const DIRS: { id: Dir; branch: Branch; title: string }[] = [
  { id: 'check-ins', branch: 'root', title: 'Check-ins' },
  { id: 'worldview', branch: 'worldview', title: 'Worldview & Beliefs' },
  { id: 'moral', branch: 'moral', title: 'Moral Principles' },
  { id: 'priorities', branch: 'priorities', title: 'Personal Priorities' },
  { id: 'identity', branch: 'identity', title: 'Identity & Self-concept' },
  { id: 'goals', branch: 'goals', title: 'Goals & Aspirations' },
];

export const DIR_BY_ID = Object.fromEntries(DIRS.map((d) => [d.id, d])) as Record<Dir, (typeof DIRS)[number]>;

/**
 * Pre-written summaries for the summarise action. Each one is only used for the
 * exact sample-profile version it was written against; anything else gets the
 * rule-based condensation in logic/notes.ts.
 */
export const PREDEFINED_SUMMARIES: Record<string, { forVersion: string; lines: string[] }> = {
  'moral/family-duty': { forVersion: 'fd-v3', lines: [
    'Children can go against their parents’ wishes on major decisions. My limit: not being absent for something that can’t be repeated.',
  ] },
  'goals/work-and-study': { forVersion: 'ws-v3', lines: [
    'Worth exploring: the Zurich PhD is the active path, an industry job in Bengaluru the fallback, teaching untried.',
    'First choice because the lab fits the detection work; cheapest test is a month of contract work. Work takes a lot of time from people close to me (7/10).',
  ] },
  'priorities/main': { forVersion: 'pm-v3', lines: [
    'For the next few years: work or studies first, then family and health (family was first in March).',
    'What matters most: choosing my own way, close relationships and achievement. Money is for freedom to change paths; from work I want interesting problems and impact.',
  ] },
};
