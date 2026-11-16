import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AnswerValue, Option, ProjectAnswer, Question, Response } from '../../types';
import { LIKERT_LABELS } from '../../data/questions';

interface Props {
  q: Question;
  response?: Response;
  onAnswer: (v: AnswerValue) => void;
  onClear: () => void;
  /** Enter in a one-line text answer: save and go on. */
  onEnter?: () => void;
  /** Whether a text box holds unsaved text (so Next can be enabled before the blur saves it). */
  onDraft?: (has: boolean) => void;
}

export function QuestionInput({ q, response, onAnswer, onClear, onEnter, onDraft }: Props) {
  const v = response?.value;
  switch (q.type) {
    case 'likert':
      return <Likert value={v as number | undefined} onAnswer={onAnswer} />;
    case 'choice':
      return (
        <div className="choices" role="radiogroup">
          {q.options!.map((o, i) => (
            <button
              key={o.value}
              role="radio"
              aria-checked={v === o.value}
              className={`choice ${v === o.value ? 'sel' : ''}`}
              onClick={() => onAnswer(o.value)}
            >
              <span className="radio" />
              <span className="grow">{o.label}</span>
              <span className="key">{i + 1}</span>
            </button>
          ))}
        </div>
      );
    case 'multi':
      return <Multi q={q} value={v as string[] | undefined} onAnswer={onAnswer} onClear={onClear} />;
    case 'rank':
      return <Rank q={q} value={v as string[] | undefined} onAnswer={onAnswer} />;
    case 'text':
      return <TextAnswer key={q.id} value={(v as string) ?? ''} placeholder={q.placeholder} onAnswer={onAnswer} onEnter={onEnter} onDraft={onDraft} />;
    case 'slider':
      return <Slider key={q.id} value={v as number | undefined} ends={q.scale} onAnswer={onAnswer} />;
    case 'sliders':
      return <Sliders key={q.id} sliders={q.sliders!} value={v as Record<string, number> | undefined} onAnswer={onAnswer} />;
    case 'project':
      return <Project key={q.id} q={q} value={v as ProjectAnswer | undefined} onAnswer={onAnswer} />;
  }
}

function Likert({ value, onAnswer }: { value?: number; onAnswer: (v: number) => void }) {
  return (
    <div className="likert" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} role="radio" aria-checked={value === n} className={value === n ? 'sel' : ''} onClick={() => onAnswer(n)}>
          <span className="key">{n}</span>
          {LIKERT_LABELS[n - 1]}
        </button>
      ))}
    </div>
  );
}

/** Pick several. An `exclusive` option ("None of these") clears the rest; `max` caps the picks. */
function Multi({ q, value, onAnswer, onClear }: { q: Question; value?: string[]; onAnswer: (v: string[]) => void; onClear: () => void }) {
  const sel = value ?? [];
  const full = q.max !== undefined && sel.filter((x) => x !== q.exclusive).length >= q.max;
  const toggle = (opt: string) => {
    let next: string[];
    if (sel.includes(opt)) next = sel.filter((x) => x !== opt);
    else if (opt === q.exclusive) next = [opt];
    else next = [...sel.filter((x) => x !== q.exclusive), opt];
    if (next.length) onAnswer(next);
    else onClear();
  };
  return (
    <div>
      <div className="chips" role="group" aria-label="Pick options">
        {q.options!.map((o) => {
          const on = sel.includes(o.value);
          return (
            <button
              key={o.value}
              className={`chip-opt ${on ? 'sel' : ''} ${o.value === q.exclusive ? 'none' : ''}`}
              aria-pressed={on}
              disabled={!on && full && o.value !== q.exclusive}
              onClick={() => toggle(o.value)}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {q.max !== undefined && (
        <div className="faint" style={{ fontSize: 12, marginTop: 8 }}>
          {sel.filter((x) => x !== q.exclusive).length} of {q.max} picked
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

function TextAnswer({ value, placeholder, onAnswer, onEnter, onDraft }: { value: string; placeholder?: string; onAnswer: (v: string) => void; onEnter?: () => void; onDraft?: (has: boolean) => void }) {
  const [draft, setDraft] = useState(value);
  const has = !!draft.trim();
  useEffect(() => onDraft?.(has), [has, onDraft]);
  const dirty = draft.trim() !== value.trim();
  const commit = () => {
    if (draft.trim() && dirty) onAnswer(draft.trim());
  };
  return (
    <div>
      <textarea
        className="input"
        rows={2}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commit();
            if (draft.trim()) onEnter?.();
          }
        }}
      />
      <div className="row" style={{ marginTop: 6 }}>
        <span className="faint grow" style={{ fontSize: 12 }}>
          {value && !dirty ? 'Saved' : 'Saved when you leave the box or press Enter'} · Shift+Enter for a new line
        </span>
        {dirty && draft.trim() && (
          <button className="btn sm" onClick={commit}>
            Save
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * A 0–10 slider. The number follows the thumb while dragging, but the answer is saved only on
 * release (the native `change` event: mouse up, touch end, or a key press).
 */
function RangeRow({ label, value, onChange }: { label?: string; value?: number; onChange: (n: number) => void }) {
  const [live, setLive] = useState<number | undefined>(value);
  const ref = useRef<HTMLInputElement>(null);
  const commit = useRef(onChange);
  commit.current = onChange;
  useEffect(() => setLive(value), [value]);
  useEffect(() => {
    const el = ref.current!;
    const onCommit = () => commit.current(Number(el.value));
    el.addEventListener('change', onCommit);
    return () => el.removeEventListener('change', onCommit);
  }, []);
  return (
    <div className="slider-row">
      {label && <span className="slider-label">{label}</span>}
      <input
        ref={ref}
        type="range"
        min={0}
        max={10}
        value={live ?? 5}
        className={live === undefined ? 'unset' : ''}
        onInput={(e) => setLive(Number((e.target as HTMLInputElement).value))}
        onChange={() => {}}
        aria-label={label ?? 'Rating'}
      />
      <span className="slider-val">{live === undefined ? '–' : live}</span>
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

function Project({ q, value, onAnswer }: { q: Question; value?: ProjectAnswer; onAnswer: (v: ProjectAnswer) => void }) {
  const [text, setText] = useState(value?.text ?? '');
  const [ratings, setRatings] = useState<Record<string, number>>(value?.ratings ?? {});
  const commit = (r = ratings) => {
    if (text.trim()) onAnswer({ text: text.trim(), ratings: r });
  };
  const sliders = q.sliders ?? [];
  return (
    <div>
      <textarea className="input" rows={2} value={text} placeholder={q.placeholder ?? 'A sentence is enough'} onChange={(e) => setText(e.target.value)} onBlur={() => commit()} />
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
        {q.scale && sliders.length === 1 && (
          <div className="slider-ends">
            <span>0 · {q.scale[0]}</span>
            <span>{q.scale[1]} · 10</span>
          </div>
        )}
      </div>
      {!text.trim() && <div className="faint" style={{ fontSize: 12, marginTop: 6 }}>Write the first part; the rating is saved with it.</div>}
    </div>
  );
}
