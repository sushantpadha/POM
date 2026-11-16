import { describe, expect, it } from 'vitest';
import { sampleFiles, SAMPLE_RESPONSES } from '../data/sampleProfile';
import { detectTensions } from '../logic/tensions';
import { FakeProvider } from './fake';
import { OllamaProvider } from './ollama';
import { SCHEMAS, summariseRequest } from './prompts';
import { reading, summarisable, summarise, wordTension } from './tasks';
import { checkReading, checkSummary, checkTension, hasFilteredPhrase, inventedFacts } from './validate';
import { retrieve } from './retrieve';
import type { JsonRequest } from './provider';

const files = sampleFiles();
const ws = files['goals/work-and-study'];
const source = summarisable(ws);
const tension = detectTensions(SAMPLE_RESPONSES, files)[0];

describe('guards', () => {
  it('drops lines with citations that were not sent, or none', () => {
    const c = checkSummary({ lines: [{ text: 'You are exploring paths.', cites: ['n1'] }, { text: 'Made up.', cites: ['n99'] }, { text: 'No source.', cites: [] }] }, ['n1', 'n2'], 'paths');
    expect(c.kept.map((l) => l.text)).toEqual(['You are exploring paths.']);
  });

  it('drops over-length lines and filtered phrases', () => {
    const long = Array(30).fill('word').join(' ');
    const c = checkSummary({ lines: [{ text: long, cites: ['n1'] }, { text: 'You should take the offer.', cites: ['n1'] }, { text: 'Deep down you want to stay.', cites: ['n1'] }, { text: 'Fine line.', cites: ['n1'] }] }, ['n1'], '');
    expect(c.kept.map((l) => l.text)).toEqual(['Fine line.']);
    expect(hasFilteredPhrase('This suggests you are anxious')).toBe(true);
    expect(hasFilteredPhrase('You said you owe a lot')).toBe(false);
    expect(hasFilteredPhrase('Consider the Zurich lab’s fit for your work.')).toBe(true);
    expect(hasFilteredPhrase('Reflect on the belief you changed.')).toBe(true);
    expect(hasFilteredPhrase('You considered the Zurich lab the best fit.')).toBe(false);
    expect(hasFilteredPhrase('Explore your work or study direction.')).toBe(true);
    expect(hasFilteredPhrase('Check-ins show most of your time went to work.')).toBe(false);
    expect(hasFilteredPhrase('Considering the Zurich PhD and a job in Bengaluru.')).toBe(false);
    // The person's own words are not the model diagnosing: "PhD in diagnostics" may be restated.
    expect(hasFilteredPhrase('Your first path is a PhD in diagnostics.', 'Zurich PhD in diagnostics — active')).toBe(false);
    expect(hasFilteredPhrase('This may be a diagnosis.', 'Zurich PhD in diagnostics')).toBe(true);
  });

  it('flags numbers and dates that are not in the input', () => {
    expect(inventedFacts('You rated it 8/10 in March.', 'I owe a lot (8/10). 14 Mar 2026')).toEqual([]);
    expect(inventedFacts('You rated it 9/10.', 'I owe a lot (8/10).')).toEqual(['9/10']);
    expect(inventedFacts('Since June.', 'nothing dated')).toEqual(['June']);
  });

  it('rejects malformed output and a tension sentence that does not start "You said"', () => {
    expect(checkSummary('not json', ['n1'], '').schemaOk).toBe(false);
    expect(checkReading({ readings: [{ text: 'x', cites: ['n1'] }], not_in_notes: true }, ['n1'], '').schemaOk).toBe(false);
    expect(checkTension({ sentence: 'These conflict.' }, '').ok).toBe(false);
    expect(checkTension({ sentence: 'You said one thing, and another.' }, '').ok).toBe(true);
  });
});

describe('tasks with the fake provider', () => {
  it('summarise maps cited ids back to stored lines', async () => {
    const lines = await summarise(new FakeProvider(), ws);
    expect(lines!.length).toBeGreaterThan(0);
    for (const l of lines!) for (const c of l.cites) expect(source.map((e) => e.id)).toContain(c);
  });

  it('falls back (null) when the model is down, garbles citations, or moralises', async () => {
    expect(await summarise(new FakeProvider(undefined, false), ws)).toBeNull();
    expect(await summarise(new FakeProvider(() => ({ lines: [{ text: 'x', cites: ['zz'] }] })), ws)).toBeNull();
    expect(await summarise(new FakeProvider(() => ({ lines: [{ text: 'You should go to Zurich.', cites: ['n1'] }] })), ws)).toBeNull();
    expect(await wordTension(new FakeProvider(() => ({ sentence: 'Clearly a conflict.' })), tension.a[0].entry, tension.b[0].entry)).toBeNull();
    expect(await reading(new FakeProvider(() => 'garbage'), 'What do I owe my family?', files)).toBeNull();
  });

  it('words a tension starting "You said" from the two lines', async () => {
    const s = await wordTension(new FakeProvider(), tension.a[0].entry, tension.b[0].entry);
    expect(s).toMatch(/^You said/);
    const labelled = await wordTension(new FakeProvider(() => ({ sentence: 'You said one thing (Note A), and another (Note B).' })), tension.a[0].entry, tension.b[0].entry);
    expect(labelled).toBe('You said one thing, and another.');
  });

  it('gives a reading that cites retrieved lines, or says the notes do not answer', async () => {
    const r = await reading(new FakeProvider(), 'What do I owe my parents?', files);
    const ids = r!.lines.map((l) => l.entry.id);
    expect(r!.readings.length).toBeGreaterThan(0);
    for (const x of r!.readings) for (const c of x.cites) expect(ids).toContain(c);
    const none = await reading(new FakeProvider(() => ({ readings: [], not_in_notes: true })), 'What do I owe my parents?', files);
    expect(none).toMatchObject({ readings: [], notInNotes: true });
    const stray = await reading(new FakeProvider(() => ({ readings: [{ text: 'Not mentioned.', cites: [] }], not_in_notes: true })), 'What do I owe my parents?', files);
    expect(stray).toMatchObject({ readings: [], notInNotes: true });
  });

  it('retrieves at most 12 lines, leaving out headings and AI lines', () => {
    const lines = retrieve('family duty parents owe work time', files);
    expect(lines.length).toBeLessThanOrEqual(12);
    expect(lines.every((l) => l.entry.provenance !== 'ai' && l.entry.kind !== 'h')).toBe(true);
    expect(lines[0].id).toBe('n1');
  });
});

describe('Ollama client', () => {
  it('sends the documented /api/chat request: no streaming, schema format, thinking off', async () => {
    const seen: { url: string; body: Record<string, unknown> }[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      seen.push({ url, body: JSON.parse(String(init?.body)) });
      return new Response(JSON.stringify({ message: { role: 'assistant', content: '{"lines":[]}' } }));
    }) as unknown as typeof fetch;
    const p = new OllamaProvider('http://localhost:11434/', 'qwen3:4b', fetchImpl);
    const req: JsonRequest = summariseRequest([{ id: 'n1', text: 'x' }]);
    expect(await p.json(req)).toEqual({ lines: [] });
    expect(seen[0].url).toBe('http://localhost:11434/api/chat');
    expect(seen[0].body).toMatchObject({ model: 'qwen3:4b', stream: false, think: false, format: SCHEMAS.summarise, options: { temperature: 0.2, num_ctx: 4096, num_predict: 300 } });
    expect((seen[0].body.messages as { role: string }[])[0].role).toBe('system');
  });

  it('retries once, then throws so the caller falls back', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      return new Response('boom', { status: 500 });
    }) as unknown as typeof fetch;
    await expect(new OllamaProvider('http://x', 'm', fetchImpl).json(summariseRequest([]))).rejects.toThrow(/500/);
    expect(calls).toBe(2);
  });

  it('is unavailable when the model is not installed or the service is down', async () => {
    const tags = (async () => new Response(JSON.stringify({ models: [{ name: 'gemma3:4b' }] }))) as unknown as typeof fetch;
    expect(await new OllamaProvider('http://x', 'gemma3:4b', tags).available()).toBe(true);
    expect(await new OllamaProvider('http://x', 'qwen3:4b', tags).available()).toBe(false);
    const down = (async () => { throw new Error('ECONNREFUSED'); }) as unknown as typeof fetch;
    expect(await new OllamaProvider('http://x', 'qwen3:4b', down).available()).toBe(false);
  });
});
