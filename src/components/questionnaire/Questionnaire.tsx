import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { AnswerValue, Question } from '../../types';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { FILE_DEF_BY_ID } from '../../data/files';
import { shortAnswer } from '../../data/questions';
import { visibleQuestions } from '../../logic/graph';
import { lastTime, thenAndNow } from '../../logic/thenNow';
import { nowIso } from '../../logic/notes';
import { QuestionInput } from './QuestionInput';

// Low / medium / high, stored as 1 / 3 / 5 so older answers still read correctly.
const CONFIDENCE: [string, number][] = [
  ['Low', 1],
  ['Medium', 3],
  ['High', 5],
];
const confidenceLevel = (n?: number) => (n === undefined ? undefined : n <= 2 ? 1 : n >= 4 ? 5 : 3);

export function Questionnaire({ nodeId }: { nodeId: string }) {
  const node = NODE_BY_ID[nodeId];
  const responses = useStore((s) => s.responses);
  // Gated questions (settled / simple / not picked) are skipped.
  const questions = useMemo(() => visibleQuestions(MODEL, nodeId, responses), [nodeId, responses]);
  const progress = useStore((s) => s.progress[nodeId]);
  // Fixed for this run: when it started, and when the node was last completed before it.
  const [runStart] = useState(() => nowIso());
  const [prevCompleted] = useState(() => progress?.completedAt);
  const focus = useStore((s) => s.focusQuestion);
  const setResponse = useStore((s) => s.setResponse);
  const setConfidence = useStore((s) => s.setConfidence);
  const confirmResponse = useStore((s) => s.confirmResponse);
  const clearResponse = useStore((s) => s.clearResponse);
  const finish = useStore((s) => s.finishQuestionnaire);
  const openFile = useStore((s) => s.openFile);
  const selectNode = useStore((s) => s.selectNode);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const [index, setIndex] = useState(0);
  const [why, setWhy] = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [lastUnlock, setLastUnlock] = useState<{ qid: string; ids: string[] } | null>(null);
  /** Notes files this run wrote to, in the order they were first touched. */
  const [touched, setTouched] = useState<string[]>([]);
  const finished = useRef(false);

  useEffect(() => {
    if (focus?.nodeId === nodeId) {
      const i = questions.findIndex((q) => q.id === focus.questionId);
      if (i >= 0) setIndex(i);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, nodeId]);

  const answered = questions.filter((q) => responses[q.id]).length;
  const doneIndex = questions.length;
  const atDone = index >= doneIndex;

  // Reaching the Done step finishes the run (answers were already written to the notes).
  useEffect(() => {
    if (atDone && !finished.current && answered > 0) {
      finished.current = true;
      finish(nodeId);
    }
  }, [atDone, answered, finish, nodeId]);

  const touch = (files: string[]) => files.length && setTouched((t) => [...new Set([...t, ...files])]);

  const answer = (q: Question, v: AnswerValue) => {
    const { opened, files } = setResponse(q.id, v);
    touch(files);
    if (opened.length) {
      setDiscovered((d) => [...new Set([...d, ...opened])]);
      setLastUnlock({ qid: q.id, ids: opened });
    }
  };

  const toGraph = (id: string) => {
    setActiveTab(0);
    selectNode(id);
  };

  const steps = (
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
      <button className={atDone ? 'active' : ''} onClick={() => setIndex(doneIndex)} aria-label="Done">
        <Check size={12} />
      </button>
    </nav>
  );

  if (atDone) {
    const tn = thenAndNow(questions, responses, runStart);
    return (
      <div className="qn-single">
        <div className="qn-main">
          <div className="qn-inner">
            {steps}
            <div className="q-card qn-done">
              <h2 className="qn-title">{node.name}: done</h2>
              <p className="muted" style={{ marginTop: 0 }}>
                You answered {answered} of {questions.length}. Each answer is already in your notes; skipped questions are not
                recorded.
              </p>
              {(tn.same.length > 0 || tn.changed.length > 0) && (
                <section className="done-section" data-then-now>
                  <h4 className="section-label">Then and now</h4>
                  <p className="muted" style={{ marginTop: 0 }}>
                    Same as last time: <b data-same>{tn.same.length}</b>
                    {tn.changed.length > 0 && <> · Changed: <b>{tn.changed.length}</b></>}
                  </p>
                  {tn.changed.length > 0 && (
                    <ul className="then-now">
                      {tn.changed.map((c) => (
                        <li key={c.q.id}>
                          <span className="faint">{c.q.text.length > 70 ? `${c.q.text.slice(0, 67)}…` : c.q.text}</span>
                          <div>
                            <span className="old">{shortAnswer(c.q, c.before)}</span> → {shortAnswer(c.q, c.after)}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}
              <section className="done-section">
                <h4 className="section-label">Notes that changed</h4>
                {touched.length ? (
                  touched.map((fileId) => (
                    <button key={fileId} className="link-row" data-changed-file={fileId} onClick={() => openFile(fileId)}>
                      <span className="grow">{FILE_DEF_BY_ID[fileId].title}</span>
                      <span className="faint mono" style={{ fontSize: 12 }}>{fileId}</span>
                    </button>
                  ))
                ) : (
                  <p className="muted" style={{ marginTop: 0 }}>No notes changed in this round.</p>
                )}
              </section>
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
              <div className="row" style={{ marginTop: 20 }}>
                <button className="btn primary" onClick={() => toGraph(nodeId)}>
                  Back to graph
                </button>
                <button className="btn ghost" onClick={() => setIndex(0)}>
                  Change answers
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const last = lastTime(responses[q.id], prevCompleted);

  return (
    <div className="qn-single">
      <div className="qn-main">
        <div className="qn-inner">
          {steps}
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
            {last !== undefined && (
              <div className="last-time">
                <span className="grow">
                  Last time: <b style={{ color: 'var(--text)', fontWeight: 500 }}>{shortAnswer(q, last)}</b>
                </span>
                <button
                  className="btn sm"
                  onClick={() => {
                    touch(confirmResponse(q.id));
                    setIndex(index + 1);
                  }}
                >
                  Still true
                </button>
              </div>
            )}
            <div className="q-input">
              <QuestionInput q={q} response={responses[q.id]} onAnswer={(v) => answer(q, v)} onClear={() => touch(clearResponse(q.id))} />
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
                <button className="btn ghost" onClick={() => touch(clearResponse(q.id))}>
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
        </div>
      </div>
    </div>
  );
}
