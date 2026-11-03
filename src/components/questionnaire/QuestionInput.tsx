import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AnswerValue, Option, ProjectAnswer, Question, Response } from '../../types';
import { LIKERT_LABELS } from '../../data/questions';

interface Props {
  q: Question;
  response?: Response;
  onAnswer: (v: AnswerValue) => void;
}

export function QuestionInput({ q, response, onAnswer }: Props) {
  const v = response?.value;
  switch (q.type) {
    case 'likert':
      return <Likert value={v as number | undefined} onAnswer={onAnswer} />;
    case 'choice':
      return (
        <div className="choices" role="radiogroup">
          {q.options!.map((o) => (
            <button
              key={o.value}
              role="radio"
              aria-checked={v === o.value}
              className={`choice ${v === o.value ? 'sel' : ''}`}
              onClick={() => onAnswer(o.value)}
            >
              <span className="radio" />
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
      return <Slider key={q.id} value={v as number | undefined} ends={q.scale} onAnswer={onAnswer} />;
    case 'sliders':
      return <Sliders key={q.id} sliders={q.sliders!} value={v as Record<string, number> | undefined} onAnswer={onAnswer} />;
    case 'project':
      return <Project key={q.id} sliders={q.sliders!} value={v as ProjectAnswer | undefined} onAnswer={onAnswer} />;
  }
}

function Likert({ value, onAnswer }: { value?: number; onAnswer: (v: number) => void }) {
  return (
    <div className="likert" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} role="radio" aria-checked={value === n} className={value === n ? 'sel' : ''} onClick={() => onAnswer(n)}>
          {LIKERT_LABELS[n - 1]}
        </button>
      ))}
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
          <div key={v} className="rank-item">
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
        <button className="btn sm" style={{ marginTop: 10 }} onClick={() => onAnswer(order)}>
          Keep this order
        </button>
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
      <textarea className="input" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={commit} />
      <div className="row" style={{ marginTop: 6 }}>
        <span className="faint grow" style={{ fontSize: 12 }}>{value && !dirty ? 'Saved' : 'Saved when you leave the box'}</span>
        {dirty && draft.trim() && (
          <button className="btn sm" onClick={commit}>
            Save
          </button>
        )}
      </div>
    </div>
  );
}

function RangeRow({ label, value, onChange }: { label?: string; value?: number; onChange: (n: number) => void }) {
  return (
    <div className="slider-row">
      {label && <span className="slider-label">{label}</span>}
      <input
        type="range"
        min={0}
        max={10}
        value={value ?? 5}
        className={value === undefined ? 'unset' : ''}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label ?? 'Rating'}
      />
      <span className="slider-val">{value === undefined ? '–' : value}</span>
    </div>
  );
}

function Slider({ value, ends, onAnswer }: { value?: number; ends?: [string, string]; onAnswer: (n: number) => void }) {
  return (
    <div>
      <RangeRow value={value} onChange={onAnswer} />
      {ends && (
        <div className="slider-ends">
          <span>0 · {ends[0]}</span>
          <span>{ends[1]} · 10</span>
        </div>
      )}
    </div>
  );
}

function Sliders({ sliders, value, onAnswer }: { sliders: Option[]; value?: Record<string, number>; onAnswer: (v: Record<string, number>) => void }) {
  return (
    <div className="slider-group">
      {sliders.map((s) => (
        <RangeRow key={s.value} label={s.label} value={value?.[s.value]} onChange={(n) => onAnswer({ ...(value ?? {}), [s.value]: n })} />
      ))}
      <div className="faint" style={{ fontSize: 12 }}>0 = not at all, 10 = extremely. Rate only what you want to.</div>
    </div>
  );
}

function Project({ sliders, value, onAnswer }: { sliders: Option[]; value?: ProjectAnswer; onAnswer: (v: ProjectAnswer) => void }) {
  const [text, setText] = useState(value?.text ?? '');
  const [ratings, setRatings] = useState<Record<string, number>>(value?.ratings ?? {});
  const commit = (r = ratings) => {
    if (text.trim()) onAnswer({ text: text.trim(), ratings: r });
  };
  return (
    <div>
      <textarea className="input" rows={3} value={text} placeholder="A sentence is enough" onChange={(e) => setText(e.target.value)} onBlur={() => commit()} />
      <div className="slider-group" style={{ marginTop: 12 }}>
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
      {!text.trim() && <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>Describe the project first; ratings are saved with it.</div>}
    </div>
  );
}
