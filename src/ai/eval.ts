// Eval fixtures and scoring for scripts/ai-eval.mjs (PLAN_V2 5.7). Not imported by the app.
// Each fixture is built from the sample profile and scored on the raw model output with the
// same checks the app's guards use.
import type { Entry } from '../types';
import { sampleFiles, SAMPLE_RESPONSES } from '../data/sampleProfile';
import { QUESTION_BY_ID } from '../data/questions';
import { detectTensions } from '../logic/tensions';
import type { JsonRequest, LLMProvider } from './provider';
import { LIMITS, readingRequest, summariseRequest, tensionRequest, type PromptLine } from './prompts';
import { checkReading, checkSummary, checkTension, lineOk } from './validate';
import { retrieve } from './retrieve';
import { summarisable } from './tasks';

export interface Fixture {
  id: string;
  request: JsonRequest;
  score: (raw: unknown) => Checks;
}

export interface Checks {
  json: boolean;
  citations: boolean;
  length: boolean;
  phrases: boolean;
  facts: boolean;
}

export const CHECK_NAMES: (keyof Checks)[] = ['json', 'citations', 'length', 'phrases', 'facts'];

const plain = (t: string) => t.replace(/\*\*|\*|`/g, '').replace(/\[\[([^\]]+)\]\]/g, '$1');

function linesScore(c: { schemaOk: boolean; lines: ReturnType<typeof checkSummary>['lines'] }, needLines: boolean): Checks {
  const has = c.lines.length > 0;
  return {
    json: c.schemaOk && (has || !needLines),
    citations: c.schemaOk && c.lines.every((l) => l.citesOk),
    length: c.schemaOk && c.lines.every((l) => l.lengthOk),
    phrases: c.schemaOk && c.lines.every((l) => l.phraseOk),
    facts: c.schemaOk && c.lines.every((l) => l.factsOk),
  };
}

export function fixtures(): Fixture[] {
  const files = sampleFiles();
  const out: Fixture[] = [];

  // Summaries (5)
  for (const fileId of ['priorities/main', 'moral/main', 'goals/work-and-study', 'identity/tendencies', 'goals/main']) {
    const lines: PromptLine[] = summarisable(files[fileId]).map((e, i) => ({ id: `n${i + 1}`, text: plain(e.text) }));
    const input = lines.map((l) => l.text).join('\n');
    out.push({
      id: `summarise ${fileId}`,
      request: summariseRequest(lines),
      score: (raw) => linesScore(checkSummary(raw, lines.map((l) => l.id), input, LIMITS.summaryLines, LIMITS.summaryWords), true),
    });
  }

  // Tension wording (4): the sample's three, plus rule 4 once PC1 = take.
  const pc1: Entry = { id: 'pc1', kind: 'li', text: QUESTION_BY_ID.PC1.note('take'), createdAt: '', updatedAt: '', provenance: 'auto', sourceItemId: 'PC1', locked: false };
  files['priorities/trade-offs'].current.entries.push(pc1);
  const tensions = detectTensions({ ...SAMPLE_RESPONSES, PC1: { value: 'take', answeredAt: '2026-11-01T00:00:00Z' } }, files);
  for (const t of tensions) {
    const a = plain(t.a[0].entry.text);
    const b = plain(t.b[0].entry.text);
    out.push({
      id: `tension ${t.rule.id}`,
      request: tensionRequest(a, b),
      score: (raw) => {
        const c = checkTension(raw, `${a}\n${b}`, LIMITS.tensionWords);
        return { json: c.schemaOk && c.startOk, citations: true, length: c.lengthOk, phrases: c.phraseOk, facts: c.factsOk };
      },
    });
  }

  // Readings (6), the last one not answerable from the notes.
  const questions: [string, boolean][] = [
    ['How do my goals relate to what I feel I owe my family?', false],
    ['What should I think about before deciding on the Zurich offer?', false],
    ['How has my view of choices and luck changed?', false],
    ['What do my monthly check-ins show?', false],
    ['What do I believe about trusting people?', false],
    ['Which city do I want to retire in, and what pension plan have I picked?', true],
  ];
  for (const [question, unanswerable] of questions) {
    const lines: PromptLine[] = retrieve(question, files).map((l) => ({ id: l.id, text: plain(l.entry.text) }));
    const input = `${question}\n${lines.map((l) => l.text).join('\n')}`;
    out.push({
      id: `reading ${question.slice(0, 40)}`,
      request: readingRequest(question, lines),
      score: (raw) => {
        const c = checkReading(raw, lines.map((l) => l.id), input, LIMITS.readings, LIMITS.readingWords);
        const s = linesScore(c, !c.notInNotes);
        // The unanswerable question passes only when the model says the notes do not answer it.
        if (unanswerable) s.json = s.json && c.notInNotes;
        return s;
      },
    });
  }
  return out;
}

export interface Result {
  fixture: string;
  checks: Checks;
  pass: boolean;
  ms: number;
  error?: string;
  raw?: unknown;
}

export async function runFixtures(provider: LLMProvider, list = fixtures(), onResult?: (r: Result) => void): Promise<Result[]> {
  const results: Result[] = [];
  for (const f of list) {
    const t0 = Date.now();
    let r: Result;
    try {
      const raw = await provider.json<unknown>(f.request);
      const checks = f.score(raw);
      r = { fixture: f.id, checks, pass: CHECK_NAMES.every((k) => checks[k]), ms: Date.now() - t0, raw };
    } catch (e) {
      const checks = { json: false, citations: false, length: false, phrases: false, facts: false };
      r = { fixture: f.id, checks, pass: false, ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
    }
    results.push(r);
    onResult?.(r);
  }
  return results;
}

export { lineOk };
