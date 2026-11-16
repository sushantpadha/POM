import type { Entry, NoteFile } from '../types';
import type { LLMProvider } from './provider';
import { LIMITS, readingRequest, summariseRequest, tensionRequest, type PromptLine } from './prompts';
import { checkReading, checkSummary, checkTension } from './validate';
import { retrieve, type Retrieved } from './retrieve';

// PLAN_V2 5.1: code decides what goes in and checks what comes out; the model only words it.
// Every task returns null when the model is unreachable or nothing survives the guards, and
// the caller then uses the rule-based output ("No AI reading for this one").

const plain = (t: string) => t.replace(/\*\*|\*|`/g, '').replace(/\[\[([^\]]+)\]\]/g, '$1');

/** Lines a summary may shorten: unlocked, generated (pencil or robot), not headings. */
export function summarisable(file: NoteFile): Entry[] {
  return file.current.entries.filter((e) => !e.locked && e.provenance !== 'human' && e.kind !== 'h' && e.text.trim());
}

export interface AiLine {
  text: string;
  /** Ids of the stored note lines this line rests on. */
  cites: string[];
}

/** Summarise a note: the model shortens the unlocked generated lines into at most 3 lines. */
export async function summarise(provider: LLMProvider, file: NoteFile): Promise<AiLine[] | null> {
  const source = summarisable(file);
  if (source.length < 2) return null;
  const lines: PromptLine[] = source.map((e, i) => ({ id: `n${i + 1}`, text: plain(e.text) }));
  const byId = new Map(lines.map((l, i) => [l.id, source[i].id]));
  try {
    const raw = await provider.json<unknown>(summariseRequest(lines));
    const { kept } = checkSummary(raw, lines.map((l) => l.id), lines.map((l) => l.text).join('\n'), LIMITS.summaryLines, LIMITS.summaryWords);
    if (!kept.length) return null;
    return kept.map((l) => ({ text: l.text, cites: l.cites.map((c) => byId.get(c)!) }));
  } catch {
    return null;
  }
}

/** Word a tension: rules picked the pair; the model writes one "You said …" sentence from the two lines. */
export async function wordTension(provider: LLMProvider, a: Entry, b: Entry): Promise<string | null> {
  const ta = plain(a.text);
  const tb = plain(b.text);
  try {
    const raw = await provider.json<unknown>(tensionRequest(ta, tb));
    const c = checkTension(raw, `${ta}\n${tb}`, LIMITS.tensionWords);
    return c.ok ? c.sentence : null;
  } catch {
    return null;
  }
}

export interface Reading {
  /** The retrieved lines, which code shows as "What your notes say". */
  lines: Retrieved[];
  readings: AiLine[];
  notInNotes: boolean;
}

/** A reading for Ask, only when the user asks for one. Code retrieves and quotes the lines. */
export async function reading(provider: LLMProvider, question: string, files: Record<string, NoteFile>): Promise<Reading | null> {
  const lines = retrieve(question, files);
  if (!lines.length) return { lines, readings: [], notInNotes: true };
  const prompt: PromptLine[] = lines.map((l) => ({ id: l.id, text: plain(l.entry.text) }));
  try {
    const raw = await provider.json<unknown>(readingRequest(question, prompt));
    const c = checkReading(raw, prompt.map((p) => p.id), `${question}\n${prompt.map((p) => p.text).join('\n')}`, LIMITS.readings, LIMITS.readingWords);
    if (!c.schemaOk) return null;
    if (c.notInNotes) return { lines, readings: [], notInNotes: true };
    if (!c.kept.length) return null;
    const byId = new Map(lines.map((l) => [l.id, l.entry.id]));
    return { lines, readings: c.kept.map((r) => ({ text: r.text, cites: r.cites.map((x) => byId.get(x)!) })), notInNotes: false };
  } catch {
    return null;
  }
}
