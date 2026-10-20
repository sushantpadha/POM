import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AnswerValue, GoalAnswer, Question, Response } from '../../types';
import { LIKERT_LABELS } from '../../data/questions';

interface Props {
  q: Question;
  response?: Response;
  onAnswer: (v: AnswerValue) => void;
}

export function QuestionInput({ q, response, onAnswer }: Props) {
  switch (q.type) {
    case 'likert':
      return <Likert q={q} value={response?.value as number | undefined} onAnswer={onAnswer} />;
    case 'choice':
      return (
        <div className="choices" role="radiogroup">
          {q.options!.map((o) => (
            <button
              key={o.value}
              role="radio"
              aria-checked={response?.value === o.value}
              className={`choice ${response?.value === o.value ? 'sel' : ''}`}
              onClick={() => onAnswer(o.value)}
            >
              <span className="radio" />
              {o.label}
            </button>
          ))}
        </div>
      );
    case 'rank':
      return <Rank q={q} value={response?.value as string[] | undefined} onAnswer={onAnswer} />;
    case 'text':
      return <TextAnswer key={q.id} value={(response?.value as string) ?? ''} onAnswer={onAnswer} />;
    case 'goal':
      return <GoalInput key={q.id} value={response?.value as GoalAnswer | undefined} onAnswer={onAnswer} />;
  }
}

function Likert({ q, value, onAnswer }: { q: Question; value?: number; onAnswer: (v: number) => void }) {
  const ends = q.scale ?? [LIKERT_LABELS[0], LIKERT_LABELS[4]];
  return (
    <div>
      <div className="likert" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            className={value === n ? 'sel' : ''}
            onClick={() => onAnswer(n)}
            title={q.scale ? undefined : LIKERT_LABELS[n - 1]}
          >
            <b>{n}</b>
            {!q.scale && <span>{LIKERT_LABELS[n - 1]}</span>}
          </button>
        ))}
      </div>
      {q.scale && (
        <div className="likert-ends">
          <span>{ends[0]}</span>
          <span>{ends[1]}</span>
        </div>
      )}
    </div>
  );
}

function Rank({ q, value, onAnswer }: { q: Question; value?: string[]; onAnswer: (v: string[]) => void }) {
  const [order, setOrder] = useState<string[]>(value ?? q.options!.map((o) => o.value));
  useEffect(() => {
    if (value) setOrder(value);
  }, [value]);
  const move = (i: number, d: number) => {
    const next = [...order];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setOrder(next);
    onAnswer(next);
  };
  return (
    <div>
      <div className="rank-list">
        {order.map((v, i) => (
          <div key={v} className={`rank-item ${value ? 'moved' : ''}`}>
            <span className="pos">{i + 1}</span>
            <span className="grow">{q.options!.find((o) => o.value === v)?.label}</span>
            <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
              <ChevronUp size={15} />
            </button>
            <button className="icon-btn" aria-label="Move down" disabled={i === order.length - 1} onClick={() => move(i, 1)}>
              <ChevronDown size={15} />
            </button>
          </div>
        ))}
      </div>
      {!value && (
        <div className="row" style={{ marginTop: 10 }}>
          <span className="faint" style={{ fontSize: 12 }}>Reorder with the arrows, or</span>
          <button className="btn sm" onClick={() => onAnswer(order)}>
            Keep this order
          </button>
        </div>
      )}
    </div>
  );
}

function TextAnswer({ value, onAnswer }: { value: string; onAnswer: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const dirty = draft.trim() !== value.trim();
  const commit = () => {
    if (draft.trim() && dirty) onAnswer(draft.trim());
  };
  return (
    <div>
      <textarea
        className="input"
        rows={4}
        value={draft}
        placeholder="A few sentences is plenty."
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
      />
      <div className="row" style={{ marginTop: 8 }}>
        <span className="faint grow" style={{ fontSize: 12 }}>
          {dirty ? 'Unsaved — saved when you leave the field.' : value ? 'Saved.' : 'Short answers are fine.'}
        </span>
        <button className="btn sm" disabled={!draft.trim() || !dirty} onClick={commit}>
          Save answer
        </button>
      </div>
    </div>
  );
}

function GoalInput({ value, onAnswer }: { value?: GoalAnswer; onAnswer: (v: GoalAnswer) => void }) {
  const [text, setText] = useState(value?.text ?? '');
  const [importance, setImportance] = useState(value?.importance ?? 7);
  const commit = (imp = importance) => {
    if (text.trim()) onAnswer({ text: text.trim(), importance: imp });
  };
  return (
    <div>
      <textarea
        className="input"
        rows={3}
        value={text}
        placeholder="e.g. Build a career in … / Live near … / Learn to …"
        onChange={(e) => setText(e.target.value)}
        onBlur={() => commit()}
      />
      <div className="slider-row">
        <span className="muted" style={{ fontSize: 12.5 }}>How important is it?</span>
        <input
          type="range"
          min={1}
          max={10}
          value={importance}
          onChange={(e) => {
            setImportance(Number(e.target.value));
            commit(Number(e.target.value));
          }}
          aria-label="Importance"
        />
        <span className="slider-val">{importance}/10</span>
      </div>
      {!text.trim() && <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>Describe the goal first; the rating is saved with it.</div>}
    </div>
  );
}
