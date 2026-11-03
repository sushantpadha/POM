import { useState } from 'react';
import { useStore } from '../../store/store';
import { ASK_SPECS, LOW_CONFIDENCE_QUESTION } from '../../data/ask';
import { answer, type AskResult } from '../../logic/ask';
import { RichText } from '../note/RichText';

export function Ask() {
  const aiEnabled = useStore((s) => s.aiEnabled);
  const files = useStore((s) => s.files);
  const responses = useStore((s) => s.responses);
  const profile = useStore((s) => s.profile);
  const go = useStore((s) => s.go);
  const openFile = useStore((s) => s.openFile);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<{ q: string; r: AskResult } | null>(null);

  if (!aiEnabled) {
    return (
      <div className="page">
        <h1 className="page-title">Ask your journal</h1>
        <p className="page-sub">AI is turned off, so nothing from your notes is read here.</p>
        <button className="btn" onClick={() => go({ name: 'data' })}>
          Change this in Data
        </button>
      </div>
    );
  }

  const examples = [...ASK_SPECS.filter((s) => profile === 'sample' || !s.sampleOnly).map((s) => s.question), LOW_CONFIDENCE_QUESTION];
  const ask = (q: string) => {
    if (!q.trim()) return;
    setResult({ q: q.trim(), r: answer(q.trim(), files, responses, profile === 'sample') });
    setInput('');
  };
  const cite = (r: AskResult, ns: number[]) =>
    ns.map((n) => {
      const c = r.citations.find((x) => x.n === n)!;
      return (
        <button key={n} className="cite" title={files[c.fileId].title} onClick={() => openFile(c.fileId, { entryId: c.entry.id })}>
          [{n}]
        </button>
      );
    });

  return (
    <div className="page">
      <h1 className="page-title">Ask your journal</h1>
      <p className="page-sub">Answers come only from your notes. Your own words come first, then a labelled reading.</p>

      <form
        className="ask-form"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your notes" aria-label="Your question" />
        <button className="btn primary" disabled={!input.trim()}>
          Ask
        </button>
      </form>

      {!result && (
        <div className="examples">
          {examples.map((q) => (
            <button key={q} className="link" onClick={() => ask(q)}>
              {q}
            </button>
          ))}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 26 }}>
          <p className="asked">{result.q}</p>
          <div className="answer-part">
            <h4>What your notes say</h4>
            {result.r.reported.length ? (
              <ul>
                {result.r.reported.map((x) => (
                  <li key={x.entry.id}>
                    <RichText text={x.entry.text} />
                    {cite(result.r, [x.cite])}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No notes match this yet.</p>
            )}
          </div>
          <div className="answer-part">
            <h4>
              Reading <span className="ai-tag">AI</span>
            </h4>
            {result.r.interpretation.map((p, i) => (
              <p key={i} className="muted">
                {p.text}
                {cite(result.r, p.cites)}
              </p>
            ))}
          </div>
          <p className="note-small">
            Pre-written for the sample, or quoted from your notes; there is no AI in this prototype. A reading can be wrong.
            It is not advice or a diagnosis.
          </p>
          <button className="link small" style={{ marginTop: 20 }} onClick={() => setResult(null)}>
            Ask something else
          </button>
        </div>
      )}
    </div>
  );
}
