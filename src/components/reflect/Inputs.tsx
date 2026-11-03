import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AnswerValue, Option, ProjectAnswer, Question, Response } from '../../types';
import { LIKERT_LABELS } from '../../data/questions';

interface Props {
  q: Question;
  response?: Response;
  onAnswer: (v: AnswerValue) => void;
}

/** Nothing is selected by default; a value exists only once the person chooses one. */
export function QuestionInput({ q, response, onAnswer }: Props) {
  const v = response?.value;
  switch (q.type) {
    case 'likert':
      return (
        <div className="likert" role="radiogroup">
          {LIKERT_LABELS.map((label, i) => (
            <button key={label} role="radio" aria-checked={v === i + 1} className={v === i + 1 ? 'sel' : ''} onClick={() => onAnswer(i + 1)}>
              {label}
            </button>
          ))}
        </div>
      );
    case 'choice':
      return (
        <div className="choices" role="radiogroup">
          {q.options!.map((o) => (
            <button key={o.value} role="radio" aria-checked={v === o.value} className={`choice ${v === o.value ? 'sel' : ''}`} onClick={() => onAnswer(o.value)}>
              {o.label}
            </button>
          ))}
        </div>
      );
    case 'rank':
      return <Rank q={q} value={v as string[] | undefined} onAnswer={onAnswer} />;
    case 'text':
      return <TextAnswer key={q.id} value={(v as string) ?? ''} onAnswer={onAnswer} />;
    case 'slider':
      return (
        <div>
          <RangeRow value={v as number | undefined} onChange={onAnswer} />
          {q.scale && (
            <div className="slider-ends">
              <span>{q.scale[0]}</span>
              <span>{q.scale[1]}</span>
            </div>
          )}
        </div>
      );
    case 'sliders': {
      const r = (v as Record<string, number> | undefined) ?? {};
      return (
        <div>
          {q.sliders!.map((s) => (
            <RangeRow key={s.value} label={s.label} value={r[s.value]} onChange={(n) => onAnswer({ ...r, [s.value]: n })} />
          ))}
          <p className="faint small">0 is not at all, 10 is extremely.</p>
        </div>
      );
    }
    case 'project':
      return <Project key={q.id} sliders={q.sliders!} value={v as ProjectAnswer | undefined} onAnswer={onAnswer} />;
  }
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
      {order.map((v, i) => (
        <div key={v} className="rank-item">
          <span className="pos">{i + 1}</span>
          <span className="grow">{q.options!.find((o) => o.value === v)?.label}</span>
          <button className="icon-btn" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
            <ChevronUp size={16} />
          </button>
          <button className="icon-btn" aria-label="Move down" disabled={i === order.length - 1} onClick={() => move(i, 1)}>
            <ChevronDown size={16} />
          </button>
        </div>
      ))}
      {!value && (
        <button className="link small" style={{ marginTop: 6 }} onClick={() => onAnswer(order)}>
          This order is right
        </button>
      )}
    </div>
  );
}

function TextAnswer({ value, onAnswer }: { value: string; onAnswer: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <textarea
      className="input"
      rows={4}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft.trim() && draft.trim() !== value && onAnswer(draft.trim())}
      aria-label="Your answer"
    />
  );
}

function RangeRow({ label, value, onChange }: { label?: string; value?: number; onChange: (n: number) => void }) {
  return (
    <div className="slider-row">
      {label && <span className="label">{label}</span>}
      <input
        type="range"
        min={0}
        max={10}
        value={value ?? 5}
        className={value === undefined ? 'unset' : ''}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label ?? 'Rating from 0 to 10'}
      />
      <span className="val">{value ?? ''}</span>
    </div>
  );
}

function Project({ sliders, value, onAnswer }: { sliders: Option[]; value?: ProjectAnswer; onAnswer: (v: ProjectAnswer) => void }) {
  const [text, setText] = useState(value?.text ?? '');
  const [ratings, setRatings] = useState<Record<string, number>>(value?.ratings ?? {});
  const commit = (r = ratings) => text.trim() && onAnswer({ text: text.trim(), ratings: r });
  return (
    <div>
      <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} onBlur={() => commit()} aria-label="Your project" />
      <div style={{ marginTop: 14 }}>
        {sliders.map((s) => (
          <RangeRow
            key={s.value}
            label={s.label}
            value={ratings[s.value]}
            onChange={(n) => {
              const next = { ...ratings, [s.value]: n };
              setRatings(next);
              commit(next);
            }}
          />
        ))}
      </div>
    </div>
  );
}
