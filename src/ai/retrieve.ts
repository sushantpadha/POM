import type { Dir, Entry, NoteFile } from '../types';
import { detectDimensions } from '../logic/ask';

/** A stored note line chosen for a model call, with the short id the model sees. */
export interface Retrieved {
  id: string;
  fileId: string;
  entry: Entry;
  score: number;
}

const STOP = new Set(
  'the and for are but not you your yours with what which who whom how why when where this that these those have has had was were been being from into about over than then them they their there here just very more most some any all can could would should will my me mine our its it is am be do does did of to in on at by or if so as a an i'.split(' '),
);

export function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[’']/g, '')
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !STOP.has(w))
      .map((w) => w.replace(/(ies|es|s)$/, (m) => (m === 'ies' ? 'y' : '')).replace(/ing$/, '')),
  );
}

/**
 * Note-line retrieval for Ask (PLAN_V2 5.2): token overlap with the question, plus a bonus for
 * lines in the branches the question names. Headings and AI-written lines are left out, so a
 * reading rests on what the person or their answers said. Top 12 lines.
 */
export function retrieve(question: string, files: Record<string, NoteFile>, limit = 12): Retrieved[] {
  const q = tokens(question);
  const dims = new Set<Dir>(detectDimensions(question));
  const scored: Omit<Retrieved, 'id'>[] = [];
  for (const f of Object.values(files)) {
    for (const e of f.current.entries) {
      if (e.kind === 'h' || e.provenance === 'ai' || !e.text.trim()) continue;
      const t = tokens(e.text);
      let overlap = 0;
      for (const w of q) if (t.has(w)) overlap++;
      const score = overlap + (dims.has(f.dir) ? 0.5 : 0);
      if (score > 0) scored.push({ fileId: f.id, entry: e, score });
    }
  }
  scored.sort((a, b) => b.score - a.score || b.entry.updatedAt.localeCompare(a.entry.updatedAt));
  return scored.slice(0, limit).map((r, i) => ({ ...r, id: `n${i + 1}` }));
}
