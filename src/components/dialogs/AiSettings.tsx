import { useState } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import { useStore } from '../../store/store';
import { installedModels } from '../../ai/current';
import { SUGGESTED_MODELS } from '../../ai/provider';

export const AI_CONSENT_TEXT = 'Your notes are sent to the model running on this computer. Nothing leaves it.';

type Test = { state: 'idle' } | { state: 'testing' } | { state: 'ok' | 'missing' | 'down'; text: string };

/** "AI" section of the data dialog (PLAN_V2 5.3). AI is off by default. */
export function AiSettings() {
  const ai = useStore((s) => s.ai);
  const setAi = useStore((s) => s.setAi);
  const [asking, setAsking] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [test, setTest] = useState<Test>({ state: 'idle' });
  const on = ai.mode === 'ollama' && !!ai.consentAt;

  const runTest = async () => {
    setTest({ state: 'testing' });
    try {
      const names = await installedModels(ai);
      setModels(names);
      const has = names.some((n) => n === ai.model || n === `${ai.model}:latest`);
      setTest(
        has
          ? { state: 'ok', text: `Connected. ${ai.model} is installed (${names.length} model${names.length === 1 ? '' : 's'} in all).` }
          : { state: 'missing', text: `Connected, but ${ai.model} is not installed. Run: ollama pull ${ai.model}` },
      );
    } catch {
      setTest({
        state: 'down',
        text: `Could not reach Ollama at ${ai.baseUrl}. Is it running? For the hosted page, start it with OLLAMA_ORIGINS set to this page's address.`,
      });
    }
  };

  return (
    <section className="ai-settings" aria-label="AI settings">
      <div className="row" style={{ gap: 8 }}>
        <Bot size={15} />
        <b style={{ color: 'var(--text)', fontWeight: 500 }}>AI</b>
        <span className="grow" />
        <div className="seg" role="radiogroup" aria-label="AI">
          <button role="radio" aria-checked={!on} className={!on ? 'sel' : ''} onClick={() => { setAsking(false); setAi({ mode: 'off', consentAt: undefined }); }}>
            Off
          </button>
          <button role="radio" aria-checked={on} className={on ? 'sel' : ''} onClick={() => !on && setAsking(true)}>
            Ollama
          </button>
        </div>
      </div>
      {asking && !on && (
        <div className="callout info" data-ai-consent>
          <span>
            {AI_CONSENT_TEXT} Summaries, tension wording and readings in Ask will use it; AI text is always labelled and stays a
            draft until you accept it.
          </span>
          <div className="row" style={{ marginTop: 8 }}>
            <button className="btn sm ghost" onClick={() => setAsking(false)}>Cancel</button>
            <button
              className="btn sm primary"
              onClick={() => {
                setAi({ mode: 'ollama', consentAt: new Date().toISOString() });
                setAsking(false);
              }}
            >
              I agree, turn AI on
            </button>
          </div>
        </div>
      )}
      {!on && !asking && <p className="faint" style={{ margin: 0 }}>Off: summaries, tensions and Ask use fixed rules and pre-written text.</p>}
      {(on || asking) && (
        <>
          <label className="field">
            <span>Address</span>
            <input className="input" defaultValue={ai.baseUrl} onBlur={(e) => setAi({ baseUrl: e.target.value.trim() || 'http://localhost:11434' })} aria-label="Ollama address" />
          </label>
          <label className="field">
            <span>Model</span>
            <input className="input" list="ai-models" defaultValue={ai.model} onBlur={(e) => setAi({ model: e.target.value.trim() || 'qwen3:4b' })} aria-label="Model" />
            <datalist id="ai-models">
              {[...new Set([...models, ...SUGGESTED_MODELS])].map((m) => <option key={m} value={m} />)}
            </datalist>
          </label>
          <div className="row">
            <button className="btn sm" onClick={() => void runTest()} disabled={test.state === 'testing'}>
              {test.state === 'testing' && <Loader2 size={12} className="spin" />} Test connection
            </button>
            {test.state !== 'idle' && test.state !== 'testing' && (
              <span className={test.state === 'ok' ? 'muted' : 'new-tag'} data-ai-test={test.state} style={{ fontSize: 13 }}>
                {test.text}
              </span>
            )}
          </div>
          {models.length > 0 && (
            <div className="row wrap" style={{ gap: 6 }}>
              <span className="faint">Installed:</span>
              {models.map((m) => (
                <button key={m} className={`chip-opt ${m === ai.model ? 'sel' : ''}`} style={{ padding: '2px 10px', fontSize: 13 }} onClick={() => setAi({ model: m })}>
                  {m}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
