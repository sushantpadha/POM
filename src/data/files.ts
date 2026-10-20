import type { NoteFile } from '../types';

/** The knowledge-base layout. Filenames are conceptual, not literal file extensions. */
export const FILE_DEFS: Pick<NoteFile, 'id' | 'dir' | 'name' | 'title'>[] = [
  { id: 'ethics/main', dir: 'ethics', name: 'main', title: 'Ethics — overview' },
  { id: 'ethics/moral-principles', dir: 'ethics', name: 'moral-principles', title: 'Moral principles' },
  { id: 'ethics/family-obligations', dir: 'ethics', name: 'family-obligations', title: 'Family obligations' },
  { id: 'worldview/main', dir: 'worldview', name: 'main', title: 'Worldview — overview' },
  { id: 'worldview/personal-agency', dir: 'worldview', name: 'personal-agency', title: 'Personal agency' },
  { id: 'worldview/sources-of-knowledge', dir: 'worldview', name: 'sources-of-knowledge', title: 'Sources of knowledge' },
  { id: 'worldview/obligations-to-others', dir: 'worldview', name: 'obligations-to-others', title: 'Obligations to others' },
  { id: 'long-term-goals/main', dir: 'long-term-goals', name: 'main', title: 'Long-term goals — overview' },
  { id: 'long-term-goals/career', dir: 'long-term-goals', name: 'career', title: 'Career' },
  { id: 'long-term-goals/relationships', dir: 'long-term-goals', name: 'relationships', title: 'Relationships' },
];

export const DIRS: { id: NoteFile['dir']; branch: 'ethics' | 'worldview' | 'goals' }[] = [
  { id: 'ethics', branch: 'ethics' },
  { id: 'worldview', branch: 'worldview' },
  { id: 'long-term-goals', branch: 'goals' },
];

/**
 * Predefined "AI" summaries for the simulated summarise action. Each one is only
 * valid for the sample-profile version it was written against; any other content
 * falls back to a rule-based condensation.
 */
export const PREDEFINED_SUMMARIES: Record<string, { forVersion: string; lines: string[] }> = {
  'ethics/main': { forVersion: 'em-v5', lines: [
    'Strong **idealism**: harm to others is treated as close to an absolute limit.',
    'Undecided on relativism, but prefers firm rules to case-by-case judgement.',
    'Family situations are where these principles are tested most — see [[ethics/family-obligations]].',
  ] },
  'ethics/family-obligations': { forVersion: 'fo-v4', lines: [
    'Family obligations are rated **highly important** and seen as part of a good life.',
    'Being nearby and reachable matters more than hands-on daily care; the named limit is missing irreplaceable moments.',
    'Concrete commitment: be in Pune for Aai’s surgery recovery in spring 2027.',
  ] },
  'long-term-goals/main': { forVersion: 'gm-v4', lines: [
    'One high-importance goal: a research career in early disease detection, motivated by a family illness.',
    'Now likely to involve relocation (Zurich offer); career ranked first for the next ten years.',
    'Priorities flagged as shifting — a retake is planned after talking with family.',
  ] },
  'worldview/main': { forVersion: 'wm-v5', lines: [
    'Sees effort as the main driver of outcomes, but less firmly than in March.',
    'Trusts scientific evidence first, then personal experience.',
    'Holds that we have real obligations to strangers.',
  ] },
};
