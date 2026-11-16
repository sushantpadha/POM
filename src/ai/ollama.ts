import type { JsonRequest, LLMProvider } from './provider';

type Fetch = typeof fetch;

export const OLLAMA_TIMEOUT_MS = 60_000;

/**
 * Client for the user's own Ollama (https://github.com/ollama/ollama/blob/main/docs/api.md):
 * GET /api/tags lists installed models; POST /api/chat with `format` set to a JSON schema
 * returns structured output in `message.content`. Thinking is off: it adds latency and
 * nothing these tasks need. Timeout 60 s, one retry, then the caller falls back.
 */
export class OllamaProvider implements LLMProvider {
  readonly name = 'ollama';

  constructor(
    readonly baseUrl: string,
    readonly model: string,
    private readonly fetchImpl: Fetch = (...a) => fetch(...a),
    private readonly timeoutMs = OLLAMA_TIMEOUT_MS,
  ) {}

  private url(path: string) {
    return `${this.baseUrl.replace(/\/+$/, '')}${path}`;
  }

  private async request(path: string, init?: RequestInit, timeoutMs = this.timeoutMs): Promise<unknown> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await this.fetchImpl(this.url(path), { ...init, signal: ctrl.signal });
      const body = await res.text();
      if (!res.ok) throw new Error(`Ollama ${path} answered ${res.status}: ${body.slice(0, 200)}`);
      return JSON.parse(body);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Names of the installed models, e.g. "qwen3:4b". */
  async listModels(): Promise<string[]> {
    const data = (await this.request('/api/tags', undefined, 5000)) as { models?: { name?: string }[] };
    return (data.models ?? []).map((m) => m.name ?? '').filter(Boolean);
  }

  async available(): Promise<boolean> {
    try {
      const names = await this.listModels();
      return names.some((n) => n === this.model || n === `${this.model}:latest`);
    } catch {
      return false;
    }
  }

  /** The request body for one structured chat call. Exported for tests. */
  body(req: JsonRequest, think: boolean | undefined = false) {
    return {
      model: this.model,
      messages: [{ role: 'system', content: req.system }, ...req.messages],
      stream: false,
      format: req.schema,
      ...(think === undefined ? {} : { think }),
      options: { temperature: 0.2, num_ctx: 4096, num_predict: 300 },
    };
  }

  async json<T>(req: JsonRequest): Promise<T> {
    let lastError: unknown;
    let think: boolean | undefined = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const data = (await this.request('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.body(req, think)),
        })) as { message?: { content?: string } };
        const content = data.message?.content ?? '';
        return JSON.parse(content) as T;
      } catch (e) {
        lastError = e;
        // Models without a thinking mode may reject the `think` field: retry without it.
        if (e instanceof Error && /think/i.test(e.message)) think = undefined;
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }
}
