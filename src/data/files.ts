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
 * Pre-written summaries for the summarise action. Each one is only used for the
 * exact sample-profile version it was written against; anything else gets the
 * rule-based condensation in logic/notes.ts.
 */
export const PREDEFINED_SUMMARIES: Record<string, { forVersion: string; lines: string[] }> = {
  'ethics/moral-principles': { forVersion: 'mp-v3', lines: [
    'Judges actions mainly by their consequences, and treats risking harm to others as close to unacceptable.',
    'Thinks lying depends on circumstances, but sees moral standards as shared rather than personal.',
  ] },
  'ethics/family-obligations': { forVersion: 'fo-v5', lines: [
    'Owes elders a lot (8/10), out of gratitude rather than obedience.',
    'The limit named is being absent for moments that can’t be repeated.',
  ] },
  'long-term-goals/main': { forVersion: 'gm-v4', lines: [
    'Career moved ahead of family in the ten-year ranking in September; close relationships still rated 9/10.',
  ] },
  'long-term-goals/career': { forVersion: 'ca-v4', lines: [
    'Current project: an MSc thesis on early cancer detection — important (9/10), enjoyable, and costly in time with family (7/10).',
    'Ten-year picture: leading a small team building open diagnostic tools, close enough to home to visit often.',
  ] },
};
