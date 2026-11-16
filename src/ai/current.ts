import type { AiSettings, LLMProvider } from './provider';
import { OllamaProvider } from './ollama';
import { FakeProvider } from './fake';

/** Dev builds only: `localStorage['pom-ai-fake'] = '1'` swaps Ollama for the deterministic fake (e2e). */
function fakeRequested(): boolean {
  if (!import.meta.env.DEV) return false;
  try {
    return localStorage.getItem('pom-ai-fake') === '1';
  } catch {
    return false;
  }
}

/** The provider for these settings, or null when AI is off or consent was not given. */
export function providerFor(ai: AiSettings): LLMProvider | null {
  if (ai.mode !== 'ollama' || !ai.consentAt) return null;
  if (fakeRequested()) return new FakeProvider(undefined, true, ai.model);
  return new OllamaProvider(ai.baseUrl, ai.model);
}

/** Models installed on the user's Ollama (for the model picker). */
export async function installedModels(ai: AiSettings): Promise<string[]> {
  if (fakeRequested()) return [ai.model || 'fake-model'];
  return new OllamaProvider(ai.baseUrl, ai.model).listModels();
}
