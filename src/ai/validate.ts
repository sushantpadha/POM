// PLAN_V2 5.6 guards. Small models invent, moralise and garble citations; code catches it.
// The same checks score the eval (scripts/ai-eval.mjs), so the app and the eval agree.

/** Phrases that moralise, diagnose or tell the person what they are. */
export const PHRASE_FILTER = ['you should', 'you need to', 'you seem', 'you are a', 'this suggests you', 'diagnos', 'personality type', 'deep down'];

export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

const norm = (s: string) => s.toLowerCase().replace(/[’`]/g, "'");

/**
 * A filtered phrase in the output, unless the person's own notes already contain it (restating
 * "PhD in diagnostics" is not the model diagnosing anyone).
 */
export const hasFilteredPhrase = (s: string, input = '') => {
  const t = norm(s);
  const inp = norm(input);
  return PHRASE_FILTER.some((p) => {
    // The whole words around each match, e.g. "diagnostics" for "diagnos".
    const re = new RegExp(`[a-z']*${p.replace(/ /g, '\\s+')}[a-z']*`, 'g');
    return (t.match(re) ?? []).some((w) => !inp.includes(w));
  });
};

const MONTHS = /\b(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sept?(ember)?|oct(ober)?|nov(ember)?|dec(ember)?)\b/gi;

/** Numbers (and their parts, e.g. 8/10 → 8, 10) and month names in a text. */
function facts(s: string): Set<string> {
  const out = new Set<string>();
  for (const m of s.match(/\d+(?:[.,:/]\d+)*/g) ?? []) {
    out.add(m);
    for (const part of m.split(/[.,:/]/)) out.add(String(Number(part)));
  }
  for (const m of s.match(MONTHS) ?? []) out.add(m.slice(0, 3).toLowerCase());
  return out;
}

/** Numbers or dates in `output` that the input does not contain. */
export function inventedFacts(output: string, input: string): string[] {
  const have = facts(input);
  const bad: string[] = [];
  for (const m of output.match(/\d+(?:[.,:/]\d+)*/g) ?? []) {
    if (!have.has(m) && !m.split(/[.,:/]/).every((p) => have.has(String(Number(p))))) bad.push(m);
  }
  for (const m of output.match(MONTHS) ?? []) if (!have.has(m.slice(0, 3).toLowerCase())) bad.push(m);
  return bad;
}

export interface LineCheck {
  text: string;
  cites: string[];
  citesOk: boolean;
  lengthOk: boolean;
  phraseOk: boolean;
  factsOk: boolean;
}

export const lineOk = (c: LineCheck) => c.citesOk && c.lengthOk && c.phraseOk && c.factsOk;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Parses `{ text, cites }[]` loosely, so a bad line can be checked (and dropped) on its own. */
function asLines(v: unknown): { text: string; cites: string[] }[] | null {
  if (!Array.isArray(v)) return null;
  if (!v.every((x) => isObj(x) && typeof x.text === 'string' && Array.isArray(x.cites))) return null;
  return v.map((x) => ({ text: (x.text as string).trim(), cites: (x.cites as unknown[]).map(String) }));
}

export function checkLine(line: { text: string; cites: string[] }, ids: Set<string>, maxWords: number, input: string): LineCheck {
  return {
    ...line,
    citesOk: line.cites.length > 0 && line.cites.every((c) => ids.has(c)),
    lengthOk: line.text.length > 0 && wordCount(line.text) <= maxWords,
    phraseOk: !hasFilteredPhrase(line.text, input),
    factsOk: inventedFacts(line.text, input).length === 0,
  };
}

export interface CheckedLines {
  schemaOk: boolean;
  lines: LineCheck[];
  /** Lines that pass every check. */
  kept: { text: string; cites: string[] }[];
}

/** Summary output: `{ lines: [{ text, cites }] }`, at most `max` lines. */
export function checkSummary(raw: unknown, ids: string[], input: string, max = 3, maxWords = 25): CheckedLines {
  const lines = isObj(raw) ? asLines(raw.lines) : null;
  if (!lines) return { schemaOk: false, lines: [], kept: [] };
  const set = new Set(ids);
  const checked = lines.map((l) => checkLine(l, set, maxWords, input));
  return { schemaOk: lines.length <= max, lines: checked, kept: checked.filter(lineOk).slice(0, max).map(({ text, cites }) => ({ text, cites })) };
}

/** Reading output: `{ readings: [{ text, cites }], not_in_notes }`. */
export function checkReading(raw: unknown, ids: string[], input: string, max = 3, maxWords = 30): CheckedLines & { notInNotes: boolean } {
  if (!isObj(raw) || typeof raw.not_in_notes !== 'boolean') return { schemaOk: false, lines: [], kept: [], notInNotes: false };
  const lines = asLines(raw.readings);
  if (!lines) return { schemaOk: false, lines: [], kept: [], notInNotes: false };
  const set = new Set(ids);
  const checked = lines.map((l) => checkLine(l, set, maxWords, input));
  return {
    schemaOk: lines.length <= max && !(raw.not_in_notes && lines.length > 0),
    lines: checked,
    kept: raw.not_in_notes ? [] : checked.filter(lineOk).slice(0, max).map(({ text, cites }) => ({ text, cites })),
    notInNotes: raw.not_in_notes,
  };
}

/** Tension output: `{ sentence }`, one sentence starting "You said", at most 30 words. */
export function checkTension(raw: unknown, input: string, maxWords = 30) {
  const sentence = isObj(raw) && typeof raw.sentence === 'string' ? raw.sentence.trim() : null;
  if (sentence === null) return { schemaOk: false, sentence: null, lengthOk: false, phraseOk: false, factsOk: false, startOk: false, ok: false };
  const lengthOk = sentence.length > 0 && wordCount(sentence) <= maxWords;
  const phraseOk = !hasFilteredPhrase(sentence, input);
  const factsOk = inventedFacts(sentence, input).length === 0;
  const startOk = /^you said\b/i.test(sentence);
  return { schemaOk: true, sentence, lengthOk, phraseOk, factsOk, startOk, ok: lengthOk && phraseOk && factsOk && startOk };
}
