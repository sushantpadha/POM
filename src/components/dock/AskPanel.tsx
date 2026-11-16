import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bot, Check, FileText, Hand, Loader2, Send } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { ASK_SPECS, LOW_CONFIDENCE_QUESTION } from '../../data/ask';
import { answer, type AskResult } from '../../logic/ask';
import { ProvenanceIcon } from '../branding';
import { RichText } from '../notes/RichText';
import { DockShell } from './Dock';
import { providerFor } from '../../ai/current';
import { reading, type AiLine } from '../../ai/tasks';
import { retrieve } from '../../ai/retrieve';
import { DIM_LABEL, detectDimensions, headFile } from '../../logic/ask';
import type { NoteFile } from '../../types';

/**
 * With AI on, "What your notes say" is assembled by code from the lines retrieval picks (the
 * same lines the model would see). There is no reading until the user asks for one.
 */
function aiAnswer(question: string, files: Record<string, NoteFile>): AskResult {
  const lines = retrieve(question, files);
  const dims = detectDimensions(question);
  const citations = lines.map((l, i) => ({ n: i + 1, fileId: l.fileId, entry: l.entry }));
  return {
    dimensions: dims.map((d) => DIM_LABEL[d]),
    mainFiles: dims.map(headFile),
    topicFiles: [...new Set(lines.map((l) => l.fileId))].filter((f) => !dims.map(headFile).includes(f)).slice(0, 4),
    reported: citations.slice(0, 6).map((c) => ({ entry: c.entry, fileId: c.fileId, cite: c.n })),
    interpretation: [],
    citations,
    predefined: false,
    missingSources: 0,
  };
}

type AiState = { status: 'idle' | 'loading' | 'failed' } | { status: 'done'; readings: AiLine[]; notInNotes: boolean };


const STEPS = [
  'Pick the areas the question is about',
  'Read their main files',
  'Read the relevant topic files',
  'Write the answer from those notes',
  'Add citations',
];

interface Turn {
  question: string;
  result: AskResult;
  stage: number; // 0..5 (5 = done)
  /** Present when AI was on for this question. */
  ai?: AiState;
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

function TurnView({ turn, onReading }: { turn: Turn; onReading: () => void }) {
  const files = useStore((s) => s.files);
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
              {i === 0 && stage > 0 && <div className="faint" style={{ fontSize: 12 }}>{r.dimensions.join(' · ')}</div>}
              {i === 1 && stage > 1 && <FileChips ids={r.mainFiles} />}
              {i === 2 && stage > 2 && (r.topicFiles.length ? <FileChips ids={r.topicFiles} /> : <div className="faint" style={{ fontSize: 12 }}>none needed</div>)}
            </div>
          </div>
        ))}
      </div>

      {stage >= 5 && (
        <>
          <div className="answer-block reported">
            <div className="bh">
              <Hand size={12} /> What your notes say
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
          {turn.ai ? (
            <AiReading turn={turn} files={files} onReading={onReading} onCite={onCite} />
          ) : (
            <div className="answer-block interp">
              <div className="bh">
                <Bot size={12} /> Interpretation{r.predefined ? ' — pre-written' : ''}
              </div>
              {r.interpretation.map((p, i) => (
                <p key={i}>
                  {p.text}
                  <Cites ns={p.cites} onCite={onCite} />
                </p>
              ))}
            </div>
          )}
          {r.missingSources > 0 && (
            <div className="disclaimer">
              <AlertTriangle size={13} style={{ flex: 'none', marginTop: 1 }} />
              {r.missingSources} note{r.missingSources > 1 ? 's this answer used are' : ' this answer used is'} no longer in your files, so the parts based on {r.missingSources > 1 ? 'them' : 'it'} were left out.
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
                        <span className="mono" style={{ fontSize: 12 }}>{c.fileId}</span>
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
                      <span className="faint" style={{ fontSize: 12 }}>
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

/** The model's reading, only on request. A reading is dropped once a line it cites is gone. */
function AiReading({ turn, files, onReading, onCite }: { turn: Turn; files: Record<string, NoteFile>; onReading: () => void; onCite: (n: number) => void }) {
  const ai = turn.ai!;
  const r = turn.result;
  const exists = (id: string) => Object.values(files).some((f) => f.current.entries.some((e) => e.id === id));
  const num = (id: string) => r.citations.find((c) => c.entry.id === id)?.n;
  if (ai.status === 'idle')
    return (
      <button className="btn" onClick={onReading} disabled={!r.citations.length}>
        <Bot size={13} /> Show a reading
      </button>
    );
  if (ai.status === 'loading')
    return (
      <div className="answer-block interp" role="status">
        <Loader2 size={13} className="spin" /> Asking the model on your computer…
      </div>
    );
  if (ai.status === 'failed')
    return <div className="answer-block interp">No AI reading for this one. The quoted notes above are what your notes say.</div>;
  if (ai.status !== 'done') return null;
  const kept = ai.readings.filter((x) => x.cites.every(exists));
  return (
    <div className="answer-block interp" data-ai-reading>
      <div className="bh">
        <span className="ai-label">AI</span> A reading
      </div>
      {ai.notInNotes ? (
        <p>Your notes do not answer this question.</p>
      ) : kept.length ? (
        kept.map((x, i) => (
          <p key={i}>
            {x.text}
            <Cites ns={x.cites.map(num).filter((n): n is number => n !== undefined)} onCite={onCite} />
          </p>
        ))
      ) : (
        <p className="faint">The reading was removed because a note it cited is gone.</p>
      )}
    </div>
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

  const ai = useStore((s) => s.ai);
  const aiOn = !!providerFor(ai);

  const ask = (q: string) => {
    const question = q.trim();
    if (!question) return;
    setInput('');
    const result = aiOn ? aiAnswer(question, files) : answer(question, files, responses, profile === 'sample');
    useStore.getState().track('ask', { question, ai: aiOn, quoted: result.reported.length });
    setTurns((t) => [...t, { question, result, stage: 0, ai: aiOn ? { status: 'idle' } : undefined }]);
  };

  const showReading = async (index: number) => {
    const provider = providerFor(useStore.getState().ai);
    if (!provider) return;
    const setAi = (state: AiState) => setTurns((t) => t.map((x, i) => (i === index ? { ...x, ai: state } : x)));
    setAi({ status: 'loading' });
    useStore.getState().track('reading_requested', { question: turns[index].question });
    const res = await reading(provider, turns[index].question, useStore.getState().files);
    useStore.getState().track('ai_output_shown', { task: 'reading', failed: !res, readings: res?.readings.length ?? 0, notInNotes: res?.notInNotes ?? false });
    setAi(res ? { status: 'done', readings: res.readings, notInNotes: res.notInNotes } : { status: 'failed' });
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
    <DockShell
      sub="Ask about your own notes. Answers quote them, with your words kept apart from any reading."
      foot={
        <>
          <div className="ask-input">
            <textarea
              className="input"
              rows={1}
              value={input}
              placeholder="Ask about your notes…"
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
            Interpretations can be wrong. Check them against the cited notes. They are not advice or a diagnosis.
          </div>
        </>
      }
    >
      {turns.length === 0 && (
        <>
          <p className="muted" style={{ margin: 0, fontSize: 12.5 }}>
            Answers come only from your notes, with your own words kept separate from interpretation. Try:
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
        <TurnView key={i} turn={t} onReading={() => void showReading(i)} />
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
    </DockShell>
  );
}
