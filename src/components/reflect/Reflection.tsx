import { useEffect, useRef, useState } from 'react';
import type { AnswerValue } from '../../types';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { BRANCH_LABEL } from '../branding';
import { Changes } from '../note/Draft';
import { QuestionInput } from './Inputs';

// Stored as 1–5 so earlier data still reads correctly: low ≤ 2, medium 3, high ≥ 4.
const CONFIDENCE: [string, number][] = [
  ['Low', 1],
  ['Medium', 3],
  ['High', 5],
];
const confidenceLevel = (n?: number) => (n === undefined ? undefined : n <= 2 ? 1 : n >= 4 ? 5 : 3);

export function Reflection({ nodeId }: { nodeId: string }) {
  const node = NODE_BY_ID[nodeId];
  const questions = MODEL.questionsByNode[nodeId];
  const responses = useStore((s) => s.responses);
  const files = useStore((s) => s.files);
  const focus = useStore((s) => s.focusQuestion);
  const setResponse = useStore((s) => s.setResponse);
  const setConfidence = useStore((s) => s.setConfidence);
  const submit = useStore((s) => s.submitQuestionnaire);
  const commit = useStore((s) => s.commitProposal);
  const cancel = useStore((s) => s.cancelProposal);
  const go = useStore((s) => s.go);
  const openFile = useStore((s) => s.openFile);
  const showTopic = useStore((s) => s.showTopic);

  const [index, setIndex] = useState(0);
  const [why, setWhy] = useState(false);
  const [opened, setOpened] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<string[] | null>(null);
  const [saved, setSaved] = useState(false);
  // Drafts are compared with the version the person had before this reflection.
  const before = useRef(Object.fromEntries(Object.entries(files).map(([id, f]) => [id, f.current]))).current;

  useEffect(() => {
    if (focus?.nodeId === nodeId) {
      const i = questions.findIndex((q) => q.id === focus.questionId);
      if (i >= 0) setIndex(i);
    }
  }, [focus, nodeId, questions]);

  const answer = (qid: string, v: AnswerValue) => {
    const unlocked = setResponse(qid, v);
    if (unlocked.length) setOpened((o) => [...new Set([...o, ...unlocked])]);
  };

  const next = () => {
    setWhy(false);
    if (index < questions.length - 1) {
      setIndex(index + 1);
      return;
    }
    // With every question skipped there is nothing to record.
    if (!questions.some((qq) => useStore.getState().responses[qq.id])) {
      setDrafts([]);
      return;
    }
    const { proposalFileIds } = submit(nodeId);
    setDrafts(proposalFileIds);
  };

  // ── End: the note that changed, not a result ──
  if (drafts) {
    const pending = drafts.filter((f) => files[f].proposal);
    return (
      <div className="page">
        <p className="kind">{node.name}</p>
        {saved || pending.length === 0 ? (
          <>
            <h1 className="page-title">{saved ? 'Saved to your journal' : 'Nothing in your notes changed'}</h1>
            <div className="stack" style={{ marginTop: 18 }}>
              {drafts.map((f) => (
                <p key={f}>
                  <a onClick={() => openFile(f)}>{files[f].title}</a>
                </p>
              ))}
            </div>
          </>
        ) : (
          <>
            <h1 className="page-title">Your notes, with these answers</h1>
            <p className="page-sub">Read the changes. Nothing is saved until you choose to.</p>
            {pending.map((f) => (
              <div key={f} className="draft">
                <div className="draft-head">
                  <h3>{files[f].title}</h3>
                </div>
                <Changes from={before[f]} to={files[f].proposal!} protectedIds={files[f].proposal!.protectedIds} />
              </div>
            ))}
            <div className="reflect-actions">
              <button
                className="btn primary"
                onClick={() => {
                  pending.forEach(commit);
                  setSaved(true);
                }}
              >
                Save to journal
              </button>
              <button
                className="btn"
                onClick={() => {
                  pending.forEach(cancel);
                  go({ name: 'journal' });
                }}
              >
                Discard
              </button>
            </div>
          </>
        )}
        {opened.length > 0 && (
          <p className="opened">
            Your answers opened {opened.map((id, i) => (
              <span key={id}>
                {i > 0 && (i === opened.length - 1 ? ' and ' : ', ')}
                <a onClick={() => showTopic(id)}>{NODE_BY_ID[id].name}</a>
              </span>
            ))}
            .
          </p>
        )}
        {(saved || pending.length === 0) && (
          <button className="btn" style={{ marginTop: 24 }} onClick={() => go({ name: 'journal' })}>
            Back to journal
          </button>
        )}
      </div>
    );
  }

  // ── One question at a time ──
  const q = questions[index];
  const res = responses[q.id];
  return (
    <div className="page">
      <div className="reflect-top">
        <span className="grow">
          {node.name !== BRANCH_LABEL[node.branch] ? `${BRANCH_LABEL[node.branch]} · ` : ''}
          {node.name} · {index + 1} of {questions.length}
        </span>
        <button className="link small" style={{ color: 'var(--faint)' }} onClick={() => go({ name: 'journal' })}>
          Stop for now
        </button>
      </div>

      <p className="kind">{q.stability === 'stable' ? 'Stable' : 'Flexible'}</p>
      <h1 className="prompt">{q.text}</h1>
      {q.help && <p className="help">{q.help}</p>}
      <p className="why">
        {why ? (
          <>
            {q.why ? `${q.why} ` : ''}
            {q.sourceNote}
          </>
        ) : (
          <button className="link" onClick={() => setWhy(true)}>
            Why we ask this
          </button>
        )}
      </p>

      <div className="answer">
        <QuestionInput key={q.id} q={q} response={res} onAnswer={(v) => answer(q.id, v)} />
        {q.askConfidence && res && (
          <div className="confidence">
            <span>How sure are you?</span>
            <div className="seg">
              {CONFIDENCE.map(([label, n]) => (
                <button key={label} className={confidenceLevel(res.confidence) === n ? 'sel' : ''} onClick={() => setConfidence(q.id, n)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="reflect-actions">
        <button className="btn" onClick={next}>
          Skip
        </button>
        <button className="btn primary" disabled={!res} onClick={next}>
          Continue
        </button>
        <span className="grow" />
        {index > 0 && (
          <button className="link small" style={{ color: 'var(--faint)' }} onClick={() => setIndex(index - 1)}>
            Back
          </button>
        )}
      </div>
    </div>
  );
}
