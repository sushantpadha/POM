import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { AnswerValue, Question } from '../../types';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { formatAnswer } from '../../data/questions';
import { useDerived } from '../../hooks/useDerived';
import { QuestionInput } from './QuestionInput';

// Low / medium / high, stored as 1 / 3 / 5 so older answers still read correctly.
const CONFIDENCE: [string, number][] = [
  ['Low', 1],
  ['Medium', 3],
  ['High', 5],
];
const confidenceLevel = (n?: number) => (n === undefined ? undefined : n <= 2 ? 1 : n >= 4 ? 5 : 3);
const confidenceLabel = (n: number) => CONFIDENCE.find(([, v]) => v === confidenceLevel(n))![0].toLowerCase();

export function Questionnaire({ nodeId }: { nodeId: string }) {
  const node = NODE_BY_ID[nodeId];
  const questions = MODEL.questionsByNode[nodeId];
  const responses = useStore((s) => s.responses);
  const focus = useStore((s) => s.focusQuestion);
  const setResponse = useStore((s) => s.setResponse);
  const setConfidence = useStore((s) => s.setConfidence);
  const clearResponse = useStore((s) => s.clearResponse);
  const submit = useStore((s) => s.submitQuestionnaire);
  const openFile = useStore((s) => s.openFile);
  const selectNode = useStore((s) => s.selectNode);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const { status } = useDerived();

  const [index, setIndex] = useState(0);
  const [why, setWhy] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [lastUnlock, setLastUnlock] = useState<{ qid: string; ids: string[] } | null>(null);
  const [done, setDone] = useState<{ proposalFileIds: string[] } | null>(null);

  useEffect(() => {
    if (focus?.nodeId === nodeId) {
      const i = questions.findIndex((q) => q.id === focus.questionId);
      if (i >= 0) {
        setIndex(i);
        setDone(null);
      }
    }
  }, [focus, nodeId, questions]);

  const answer = (q: Question, v: AnswerValue) => {
    const unlocked = setResponse(q.id, v);
    if (unlocked.length) {
      setDiscovered((d) => [...new Set([...d, ...unlocked])]);
      setLastUnlock({ qid: q.id, ids: unlocked });
    }
  };

  const toGraph = (id: string) => {
    setActiveTab(0);
    selectNode(id);
  };

  const answered = questions.filter((q) => responses[q.id]).length;
  const reviewIndex = questions.length;

  if (done) {
    return (
      <div className="qn-main" style={{ height: '100%' }}>
        <div className="qn-inner">
          <h2 className="qn-title">{node.name}: saved</h2>
          <p className="muted">
            You answered {answered} of {questions.length}. Skipped questions are not recorded.
          </p>
          {discovered.length > 0 && (
            <section className="done-section">
              <h4 className="section-label">Opened by your answers</h4>
              {discovered.map((id) => (
                <button key={id} className="link-row" onClick={() => toGraph(id)}>
                  <span className="grow">{NODE_BY_ID[id].name}</span>
                  <span className="faint">Show on graph</span>
                </button>
              ))}
            </section>
          )}
          <section className="done-section">
            <h4 className="section-label">Notes to review</h4>
            {done.proposalFileIds.length ? (
              <>
                <p className="muted" style={{ marginTop: 0 }}>
                  Your answers produced draft changes. Nothing changes until you commit them.
                </p>
                {done.proposalFileIds.map((fileId) => (
                  <button key={fileId} className="link-row" onClick={() => openFile(fileId)}>
                    <span className="grow mono" style={{ fontSize: 12.5 }}>{fileId}</span>
                    <span className="faint">Review</span>
                  </button>
                ))}
              </>
            ) : (
              <p className="muted" style={{ marginTop: 0 }}>No changes to your notes were needed.</p>
            )}
          </section>
          <div className="row" style={{ marginTop: 20 }}>
            <button className="btn" onClick={() => toGraph(nodeId)}>
              Back to graph
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                setDone(null);
                setIndex(0);
              }}
            >
              Change answers
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div className="qn-single">
      <div className="qn-main">
        <div className="qn-inner">
          {/* Just the question: a small row of steps, no titles or descriptions around it. */}
          <nav className="qn-steps" aria-label="Questions">
            {questions.map((qq, i) => (
              <button
                key={qq.id}
                className={`${i === index ? 'active' : ''} ${responses[qq.id] ? 'done' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Question ${i + 1}${responses[qq.id] ? ', answered' : ''}`}
              >
                {i + 1}
              </button>
            ))}
            <button className={index === reviewIndex ? 'active' : ''} onClick={() => setIndex(reviewIndex)} aria-label="Review and save">
              <Check size={12} />
            </button>
          </nav>

          {q ? (
            <div className="q-card" key={q.id}>
              <div className="q-meta">
                <span title={q.stability === 'stable' ? 'Expected to change slowly' : 'Expected to change as your life changes'}>
                  {q.stability === 'stable' ? 'Stable' : 'Flexible'}
                </span>
              </div>
              <p className="q-text">{q.text}</p>
              {q.help && <p className="q-help">{q.help}</p>}
              {why === q.id ? (
                <p className="q-help">
                  {q.why ? `${q.why} ` : ''}
                  {q.sourceNote}
                </p>
              ) : (
                <button className="why-link" onClick={() => setWhy(q.id)}>
                  Why we ask this
                </button>
              )}
              <div className="q-input">
                <QuestionInput q={q} response={responses[q.id]} onAnswer={(v) => answer(q, v)} />
              </div>

              {q.askConfidence && responses[q.id] && (
                <div className="confidence">
                  <span className="lbl">How sure are you?</span>
                  <div className="seg">
                    {CONFIDENCE.map(([c, n]) => (
                      <button key={c} className={confidenceLevel(responses[q.id]?.confidence) === n ? 'sel' : ''} onClick={() => setConfidence(q.id, n)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {lastUnlock?.qid === q.id && (
                <div className="unlock-callout">
                  Opened{' '}
                  {lastUnlock.ids.map((id, i) => (
                    <span key={id}>
                      {i > 0 && ', '}
                      <b>{NODE_BY_ID[id].name}</b>
                    </span>
                  ))}
                  .
                </div>
              )}

              <div className="qn-foot">
                <button className="btn ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                  <ArrowLeft size={13} /> Back
                </button>
                <span className="grow" />
                {responses[q.id] && (
                  <button className="btn ghost" onClick={() => clearResponse(q.id)}>
                    Clear
                  </button>
                )}
                <button className="btn" onClick={() => setIndex(index + 1)}>
                  Skip
                </button>
                <button className="btn primary" disabled={!responses[q.id]} onClick={() => setIndex(index + 1)}>
                  Next <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="q-card">
              <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 500 }}>Review and save</h3>
              {questions.map((qq, i) => {
                const res = responses[qq.id];
                return (
                  <div key={qq.id} className="review-row">
                    <span className="faint">{i + 1}</span>
                    <div>
                      <div>{qq.text}</div>
                      <div className="ans">
                        {res ? formatAnswer(qq, res.value) : <span className="faint">Skipped</span>}
                        {res?.confidence && <span className="faint"> · {confidenceLabel(res.confidence)} confidence</span>}
                      </div>
                    </div>
                    <button className="btn ghost sm" onClick={() => setIndex(i)}>
                      Edit
                    </button>
                  </div>
                );
              })}
              <div className="qn-foot">
                <button className="btn ghost" onClick={() => setIndex(index - 1)}>
                  <ArrowLeft size={13} /> Back
                </button>
                <span className="grow" />
                <button
                  className="btn primary"
                  disabled={answered === 0 || status[nodeId] === 'locked'}
                  onClick={() => setDone(submit(nodeId))}
                >
                  <Check size={13} /> Save answers
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
