import type { JsonRequest, LLMProvider } from './provider';

/**
 * Deterministic provider for unit tests and the e2e journey. `respond` gets the request and
 * returns the raw JSON a model would; `up: false` makes it unreachable.
 */
export class FakeProvider implements LLMProvider {
  readonly name = 'fake';
  readonly calls: JsonRequest[] = [];

  constructor(
    private readonly respond: (req: JsonRequest) => unknown = echo,
    private readonly up = true,
    readonly model = 'fake-model',
  ) {}

  async available() {
    return this.up;
  }

  async json<T>(req: JsonRequest): Promise<T> {
    this.calls.push(req);
    if (!this.up) throw new Error('fake provider is down');
    return this.respond(req) as T;
  }
}

const firstWords = (s: string, n: number) => s.split(/\s+/).slice(0, n).join(' ');

/** Notes sent in the last user message, as `[id] text`. */
function sentLines(req: JsonRequest): { id: string; text: string }[] {
  const last = req.messages[req.messages.length - 1].content;
  return [...last.matchAll(/^\[(n\d+)\] (.*)$/gm)].map((m) => ({ id: m[1], text: m[2] }));
}

/**
 * A well-behaved fake: restates the notes it was given, cites them, and stays within the
 * limits. Used by the e2e journey ("with the fake provider") and as the default in tests.
 */
export function echo(req: JsonRequest): unknown {
  const lines = sentLines(req);
  if (req.task === 'summarise') {
    return { lines: lines.slice(0, 3).map((l) => ({ text: `You wrote: ${firstWords(l.text, 18)}`, cites: [l.id] })) };
  }
  if (req.task === 'reading') {
    if (!lines.length) return { readings: [], not_in_notes: true };
    return { readings: lines.slice(0, 2).map((l) => ({ text: `Your notes say: ${firstWords(l.text, 20)}`, cites: [l.id] })), not_in_notes: false };
  }
  const last = req.messages[req.messages.length - 1].content;
  const a = (/Note A: (.*)/.exec(last)?.[1] ?? '').replace(/[.]+$/, '');
  const b = (/Note B: (.*)/.exec(last)?.[1] ?? '').replace(/[.]+$/, '');
  return { sentence: `You said “${firstWords(a, 12)}”, and “${firstWords(b, 12)}”.` };
}
