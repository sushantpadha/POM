import { useEffect, useRef, useState } from 'react';
import { Anchor, ArrowLeft, ArrowRight, Check, FileText, Info, Sparkles, Waves } from 'lucide-react';
import type { AnswerValue, Question } from '../../types';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { formatAnswer } from '../../data/questions';
import { useDerived } from '../../hooks/useDerived';
import { fmtDate } from '../../logic/format';
import { BRANCH_COLOR, BRANCH_LABEL } from '../branding';
import { QuestionInput } from './QuestionInput';

const SOURCE_LABEL: Record<Question['source'], string> = {
  'research-informed': 'Research-informed',
  adapted: 'Adapted item',
  exploratory: 'Exploratory',
};

const CONFIDENCE = ['Very unsure', 'Unsure', 'Moderate', 'Confident', 'Very confident'];

export function Questionnaire({ nodeId }: { nodeId: string }) {
  const node = NODE_BY_ID[nodeId];
  const questions = MODEL.questionsByNode[nodeId];
  const responses = useStore((s) => s.responses);
  const progress = useStore((s) => s.progress[nodeId]);
  const files = useStore((s) => s.files);
  const focus = useStore((s) => s.focusQuestion);
  const setResponse = useStore((s) => s.setResponse);
  const setConfidence = useStore((s) => s.setConfidence);
  const clearResponse = useStore((s) => s.clearResponse);
  const submit = useStore((s) => s.submitQuestionnaire);
  const openFile = useStore((s) => s.openFile);
  const selectNode = useStore((s) => s.selectNode);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const toast = useStore((s) => s.toast);
  const { status } = useDerived();

  const [index, setIndex] = useState(0);
  const [discovered, setDiscovered] = useState<string[]>([]);
  const [lastUnlock, setLastUnlock] = useState<{ qid: string; ids: string[] } | null>(null);
  const [done, setDone] = useState<{ proposalFileId?: string } | null>(null);
  const isRetake = useRef(!!progress?.completedAt).current;

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
      toast({
        tone: 'unlock',
        text: `Discovered: ${unlocked.map((id) => NODE_BY_ID[id].name).join(', ')}`,
      });
    }
  };

  const answered = questions.filter((q) => responses[q.id]).length;
  const reviewIndex = questions.length;

  if (done) {
    const proposalFile = done.proposalFileId ? files[done.proposalFileId] : undefined;
    return (
      <div className="qn-main" style={{ height: '100%' }}>
        <div className="qn-inner">
          <div className="q-card">
            <div className="row" style={{ marginBottom: 8 }}>
              <Check size={18} style={{ color: 'var(--add)' }} />
              <h2 style={{ margin: 0, fontSize: 18 }}>{node.name} — submitted</h2>
            </div>
            <p className="muted" style={{ margin: '0 0 16px' }}>
              You answered {answered} of {questions.length} questions. Skipped questions are simply left out — nothing is
              inferred from them.
            </p>
            {discovered.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <h4 className="section-label">Discovered in this session</h4>
                <div className="link-list">
                  {discovered.map((id) => (
                    <button
                      key={id}
                      className="link-row"
                      onClick={() => {
                        setActiveTab(0);
                        selectNode(id);
                      }}
                    >
                      <Sparkles size={14} style={{ color: BRANCH_COLOR[NODE_BY_ID[id].branch] }} />
                      <span className="grow">{NODE_BY_ID[id].name}</span>
                      <span className="faint">Show on graph</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {proposalFile ? (
              <div className="callout info" style={{ marginBottom: 16 }}>
                <FileText size={15} />
                <div className="grow">
                  <b>A note update for {proposalFile.id} is ready to review.</b> It is a proposal: nothing changes until you
                  commit it, and locked lines are kept as they are.
                </div>
                <button className="btn primary sm" onClick={() => openFile(proposalFile.id)}>
                  Review update
                </button>
              </div>
            ) : (
              node.fileId && (
                <div className="callout" style={{ marginBottom: 16 }}>
                  <Info size={15} />
                  <span>No note changes were needed for {node.fileId}.</span>
                </div>
              )
            )}
            <div className="row">
              <button
                className="btn"
                onClick={() => {
                  setActiveTab(0);
                  selectNode(nodeId);
                }}
              >
                Back to graph
              </button>
              <button className="btn ghost" onClick={() => { setDone(null); setIndex(0); }}>
                Review answers
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div className="qn">
      <nav className="qn-nav" aria-label="Questions">
        <div className="cp-branch" style={{ padding: '0 8px 10px' }}>
          <span className="status-dot answered" style={{ color: BRANCH_COLOR[node.branch], width: 7, height: 7 }} />
          {BRANCH_LABEL[node.branch]}
        </div>
        {questions.map((qq, i) => (
          <button key={qq.id} className={`qn-nav-item ${i === index ? 'active' : ''}`} onClick={() => setIndex(i)}>
            <span className={`n ${responses[qq.id] ? 'done' : ''}`}>{responses[qq.id] ? <Check size={10} /> : i + 1}</span>
            <span className="grow">{qq.text}</span>
          </button>
        ))}
        <button className={`qn-nav-item ${index === reviewIndex ? 'active' : ''}`} onClick={() => setIndex(reviewIndex)}>
          <span className="n">✓</span>
          <span className="grow">Review & submit</span>
        </button>
        <div className="metric-note" style={{ padding: '14px 8px 0' }}>
          {answered} of {questions.length} answered · all optional
          {isRetake && progress?.completedAt && <div>Retake — last completed {fmtDate(progress.completedAt)}</div>}
        </div>
      </nav>

      <div className="qn-main">
        <div className="qn-inner">
          <div className="qn-head">
            <h2>{node.name}</h2>
            {isRetake && <span className="chip">Retake · previous answers pre-filled</span>}
          </div>
          <p className="muted" style={{ margin: '0 0 6px', fontSize: 13 }}>{node.description}</p>
          {node.branch === 'worldview' && (
            <div className="callout warn" style={{ marginTop: 12 }}>
              <Info size={15} />
              <span>
                <b>Exploratory questions.</b> These are prompts for reflection, not a validated worldview or personality
                scale. Results are not scores.
              </span>
            </div>
          )}

          {q ? (
            <div className="q-card" key={q.id}>
              <div className="q-meta">
                <span className="chip mono">{q.id}</span>
                <span className={`chip ${q.stability}`} title={q.stability === 'stable' ? 'Expected to change slowly' : 'Expected to change with circumstances'}>
                  {q.stability === 'stable' ? <Anchor size={11} /> : <Waves size={11} />}
                  {q.stability === 'stable' ? 'Stable' : 'Flexible'}
                </span>
                <span className={`chip src-${q.source}`} title={q.sourceNote}>
                  {SOURCE_LABEL[q.source]}
                </span>
                <span className="grow" />
                {q.selfTags.map((t) => (
                  <span key={t} className="chip tag" title="Answering activates this tag">#{t}</span>
                ))}
              </div>
              <p className="q-text">{q.text}</p>
              <p className="q-help">{q.sourceNote}</p>
              <div className="q-input">
                <QuestionInput q={q} response={responses[q.id]} onAnswer={(v) => answer(q, v)} />
              </div>

              {q.askConfidence && responses[q.id] && (
                <div className="confidence">
                  <span className="lbl">How confident are you in this answer?</span>
                  <div className="seg">
                    {CONFIDENCE.map((c, i) => (
                      <button
                        key={c}
                        className={responses[q.id]?.confidence === i + 1 ? 'sel' : ''}
                        onClick={() => setConfidence(q.id, i + 1)}
                        title={c}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {lastUnlock?.qid === q.id && (
                <div className="unlock-callout">
                  <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                  <span>
                    Your answer activated{' '}
                    <span className="mono">{q.selfTags.map((t) => `#${t}`).join(' ')}</span> and discovered{' '}
                    {lastUnlock.ids.map((id, i) => (
                      <span key={id}>
                        {i > 0 && ', '}
                        <b>{NODE_BY_ID[id].name}</b>
                      </span>
                    ))}
                    .
                  </span>
                </div>
              )}

              <div className="qn-foot">
                <button className="btn ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
                  <ArrowLeft size={13} /> Back
                </button>
                <span className="grow" />
                {responses[q.id] && (
                  <button className="btn ghost" onClick={() => clearResponse(q.id)} title="Remove this answer">
                    Clear answer
                  </button>
                )}
                {!responses[q.id] && (
                  <button className="btn ghost" onClick={() => setIndex(index + 1)}>
                    Skip
                  </button>
                )}
                <button className="btn primary" onClick={() => setIndex(index + 1)}>
                  {index === questions.length - 1 ? 'Review' : 'Next'} <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div className="q-card">
              <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Review & submit</h3>
              <p className="muted" style={{ margin: '0 0 10px', fontSize: 12.5 }}>
                Submitting records this assessment’s date and proposes an update to your notes. You can submit with
                questions skipped.
              </p>
              {questions.map((qq, i) => {
                const res = responses[qq.id];
                return (
                  <div key={qq.id} className="review-row">
                    <span className="chip mono" style={{ justifySelf: 'start' }}>{qq.id}</span>
                    <div>
                      <div>{qq.text}</div>
                      <div className="ans">
                        {res ? formatAnswer(qq, res.value) : <span className="faint">Skipped</span>}
                        {res?.confidence && <span className="faint"> · confidence {res.confidence}/5</span>}
                      </div>
                    </div>
                    <button className="btn ghost sm" onClick={() => setIndex(i)}>Edit</button>
                  </div>
                );
              })}
              <div className="qn-foot">
                <button className="btn ghost" onClick={() => setIndex(index - 1)}>
                  <ArrowLeft size={13} /> Back
                </button>
                <span className="grow" />
                <span className="faint" style={{ fontSize: 12 }}>
                  {answered} of {questions.length} answered
                </span>
                <button
                  className="btn primary"
                  disabled={answered === 0 || status[nodeId] === 'locked'}
                  onClick={() => setDone(submit(nodeId))}
                >
                  <Check size={13} /> {isRetake ? 'Submit retake' : 'Submit'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
