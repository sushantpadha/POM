import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bot, Check, FileText, Hand, Loader2, Send } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { ASK_SPECS, LOW_CONFIDENCE_QUESTION } from '../../data/ask';
import { answer, type AskResult } from '../../logic/ask';
import { ProvenanceIcon } from '../branding';
import { RichText } from '../notes/RichText';
import { FloatShell } from './FloatingControls';


const STEPS = [
  'Identify relevant dimensions',
  'Retrieve the relevant main files',
  'Retrieve relevant topic files',
  'Generate a response from the retrieved notes',
  'Attach citations',
];

interface Turn {
  question: string;
  result: AskResult;
  stage: number; // 0..5 (5 = done)
}

function FileChips({ ids }: { ids: string[] }) {
  const openFile = useStore((s) => s.openFile);
  return (
    <div className="files">
      {ids.map((id) => (
        <button key={id} className="chip mono link" style={{ border: 0 }} onClick={() => openFile(id)}>
          <FileText size={10} /> {id}
        </button>
      ))}
    </div>
  );
}

function Cites({ ns, onCite }: { ns: number[]; onCite: (n: number) => void }) {
  return (
    <>
      {ns.map((n) => (
        <button key={n} className="cite" onClick={() => onCite(n)} aria-label={`Citation ${n}`}>
          {n}
        </button>
      ))}
    </>
  );
}

function examplesFor(sample: boolean): string[] {
  return [...ASK_SPECS.filter((s) => sample || !s.sampleOnly).map((s) => s.question), LOW_CONFIDENCE_QUESTION];
}

function TurnView({ turn }: { turn: Turn }) {
  const openFile = useStore((s) => s.openFile);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const { result: r, stage } = turn;
  const onCite = (n: number) => {
    const c = r.citations.find((x) => x.n === n);
    if (c) openFile(c.fileId, { entryId: c.entry.id });
  };

  return (
    <>
      <div className="q-bubble">{turn.question}</div>
      <div className="steps" aria-live="polite">
        {STEPS.map((label, i) => (
          <div key={label} className={`step ${stage > i ? 'done' : stage === i ? 'active' : ''}`}>
            <span className="si">
              {stage > i ? (
                <Check size={13} style={{ color: 'var(--add)' }} />
              ) : stage === i ? (
                <Loader2 size={13} className="spin" />
              ) : (
                <span style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--text-faint)' }} />
              )}
            </span>
            <div>
              {label}
              {i === 0 && stage > 0 && <div className="faint" style={{ fontSize: 11.5 }}>{r.dimensions.join(' · ')}</div>}
              {i === 1 && stage > 1 && <FileChips ids={r.mainFiles} />}
              {i === 2 && stage > 2 && (r.topicFiles.length ? <FileChips ids={r.topicFiles} /> : <div className="faint" style={{ fontSize: 11.5 }}>none needed</div>)}
            </div>
          </div>
        ))}
      </div>

      {stage >= 5 && (
        <>
          <div className="answer-block reported">
            <div className="bh">
              <Hand size={12} /> What your notes say — user-reported
            </div>
            {r.reported.length ? (
              <ul>
                {r.reported.map((x) => (
                  <li key={x.entry.id}>
                    <RichText text={x.entry.text} />
                    <Cites ns={[x.cite]} onCite={onCite} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="faint">No matching notes were found.</p>
            )}
          </div>
          <div className="answer-block interp">
            <div className="bh">
              <Bot size={12} /> Interpretation — AI-generated{!r.predefined && ' (rule-based)'}
            </div>
            {r.interpretation.map((p, i) => (
              <p key={i}>
                {p.text}
                <Cites ns={p.cites} onCite={onCite} />
              </p>
            ))}
          </div>
          {r.missingSources > 0 && (
            <div className="disclaimer">
              <AlertTriangle size={13} style={{ flex: 'none', marginTop: 1 }} />
              {r.missingSources} expected source{r.missingSources > 1 ? 's are' : ' is'} no longer in your notes and {r.missingSources > 1 ? 'were' : 'was'} left out.
            </div>
          )}
          <div>
            <h4 className="section-label">Sources</h4>
            <div className="cite-list">
              {r.citations.map((c) => {
                const q = c.entry.sourceItemId ? MODEL.questions.find((x) => x.id === c.entry.sourceItemId) : undefined;
                return (
                  <div key={c.n} className="cite-row" onClick={() => openFile(c.fileId, { entryId: c.entry.id })} role="button">
                    <span className="n">[{c.n}]</span>
                    <span>
                      <span className="row" style={{ gap: 6 }}>
                        <ProvenanceIcon p={c.entry.provenance} size={11} />
                        <span className="mono" style={{ fontSize: 11 }}>{c.fileId}</span>
                        {q && (
                          <button
                            className="chip mono link"
                            style={{ height: 17, border: 0 }}
                            title={`Assessment item: ${q.text}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openQuestionnaire(q.nodeId, q.id);
                            }}
                          >
                            item {q.id}
                          </button>
                        )}
                      </span>
                      <span className="faint" style={{ fontSize: 11.5 }}>
                        {c.entry.text.replace(/\*|\[\[|\]\]/g, '').slice(0, 90)}
                        {c.entry.text.length > 90 ? '…' : ''}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function AskPanel() {
  const files = useStore((s) => s.files);
  const responses = useStore((s) => s.responses);
  const profile = useStore((s) => s.profile);
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const bodyEnd = useRef<HTMLDivElement>(null);
  const EXAMPLES = examplesFor(profile === 'sample');

  const ask = (q: string) => {
    const question = q.trim();
    if (!question) return;
    setInput('');
    setTurns((t) => [...t, { question, result: answer(question, files, responses, profile === 'sample'), stage: 0 }]);
  };

  // Simulated pipeline: advance one stage at a time.
  const last = turns[turns.length - 1];
  useEffect(() => {
    if (!last || last.stage >= 5) return;
    const id = setTimeout(
      () => setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, stage: x.stage + 1 } : x))),
      last.stage === 3 ? 900 : 450,
    );
    return () => clearTimeout(id);
  }, [last]);

  useEffect(() => {
    bodyEnd.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [turns]);

  const busy = !!last && last.stage < 5;

  return (
    <FloatShell
      icon="?"
      title="Ask the model"
      sub="Simulated — answers are built from your current notes"
      foot={
        <>
          <div className="ask-input">
            <textarea
              className="input"
              rows={1}
              value={input}
              placeholder="Ask about your ethics, worldview or goals…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!busy) ask(input);
                }
              }}
            />
            <button className="btn primary" style={{ height: 40 }} disabled={busy || !input.trim()} onClick={() => ask(input)} aria-label="Ask">
              <Send size={14} />
            </button>
          </div>
          <div className="disclaimer" style={{ marginTop: 8 }}>
            <Bot size={13} style={{ flex: 'none', marginTop: 1 }} />
            Interpretations are generated and may be incorrect or miss context. Check them against the cited notes; they are
            not advice or a diagnosis.
          </div>
        </>
      }
    >
      {turns.length === 0 && (
        <>
          <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
            The model first finds which dimensions your question touches, reads those <span className="mono">main</span>{' '}
            files, then the relevant topic files, and answers with citations. Try an example:
          </p>
          <div className="examples">
            {EXAMPLES.map((q) => (
              <button key={q} className="example" onClick={() => ask(q)}>
                {q}
              </button>
            ))}
          </div>
        </>
      )}
      {turns.map((t, i) => (
        <TurnView key={i} turn={t} />
      ))}
      {turns.length > 0 && !busy && (
        <div className="examples">
          {EXAMPLES.filter((q) => !turns.some((t) => t.question === q)).slice(0, 2).map((q) => (
            <button key={q} className="example" onClick={() => ask(q)}>
              {q}
            </button>
          ))}
        </div>
      )}
      <div ref={bodyEnd} />
    </FloatShell>
  );
}
