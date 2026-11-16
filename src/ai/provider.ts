/**
 * A model that answers with JSON matching a schema. The app has two: the user's own Ollama
 * (ollama.ts) and a deterministic fake for tests (fake.ts). There is no hosted API.
 */
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface JsonRequest {
  /** The task, used by the fake provider and by the eval report. */
  task: 'summarise' | 'tension' | 'reading';
  system: string;
  messages: ChatMessage[];
  /** JSON schema the answer must follow (Ollama's structured outputs). */
  schema: Record<string, unknown>;
}

export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  /** True when the service answers and the model is installed. Never throws. */
  available(): Promise<boolean>;
  /** Parsed JSON answer. Throws on network, timeout or parse failure. */
  json<T>(req: JsonRequest): Promise<T>;
}

export interface AiSettings {
  mode: 'off' | 'ollama';
  baseUrl: string;
  model: string;
  /** When the user agreed that notes are sent to the model on this computer. */
  consentAt?: string;
}

// Default chosen by scripts/ai-eval.mjs (see AI_EVAL.md): qwen3:1.7b passed 12 of 15 fixtures in every
// run, the most consistent of the four compared; no model reached the 90% target.
export const DEFAULT_AI: AiSettings = { mode: 'off', baseUrl: 'http://localhost:11434', model: 'qwen3:1.7b' };

/** Models the README and the settings suggest. The model name is a setting, not a constant. */
export const SUGGESTED_MODELS = ['qwen3:1.7b', 'qwen3:4b', 'gemma3:4b', 'phi4-mini'];
