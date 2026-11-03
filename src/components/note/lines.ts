import type { Entry, EntryKind } from '../../types';

const PREFIX: Record<EntryKind, string> = { h: '## ', li: '- ', quote: '> ', p: '' };

/** Lines are edited as lightweight markdown; the leading marker sets the kind. */
export function toSource(e: Pick<Entry, 'kind' | 'text'>): string {
  return PREFIX[e.kind] + e.text;
}

export function parseSource(src: string): { kind: EntryKind; text: string } {
  const s = src.trim();
  if (/^#{1,3}\s/.test(s)) return { kind: 'h', text: s.replace(/^#{1,3}\s+/, '') };
  if (/^>\s?/.test(s)) return { kind: 'quote', text: s.replace(/^>\s?/, '') };
  if (/^[-*]\s/.test(s)) return { kind: 'li', text: s.replace(/^[-*]\s+/, '') };
  return { kind: 'p', text: s };
}
