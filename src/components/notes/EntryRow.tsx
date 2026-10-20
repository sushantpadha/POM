import { useEffect, useRef, useState } from 'react';
import { Lock, Trash2, Unlock } from 'lucide-react';
import type { Entry, EntryKind } from '../../types';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { fmtDate, fmtDateTime } from '../../logic/format';
import { PROVENANCE, ProvenanceIcon } from '../branding';
import { RichText } from './RichText';

const PREFIX: Record<EntryKind, string> = { h: '## ', li: '- ', quote: '> ', p: '' };

/** Lines are edited as lightweight markdown; the leading marker sets the kind. */
export function toSource(e: Pick<Entry, 'kind' | 'text'>): string {
  return PREFIX[e.kind] + e.text;
}

export function parseSource(src: string): { kind: EntryKind; text: string } {
  const s = src.trim();
  if (/^#{1,3}\s/.test(s)) return { kind: 'h', text: s.replace(/^#{1,3}\s+/, '') };
  if (/^>\s?/.test(s)) return { kind: 'quote', text: s.replace(/^>\s?/, '') };
  if (/^[-*]\s/.test(s)) return { kind: 'li', text: s.replace(/^[-*]\s+/, '') };
  return { kind: 'p', text: s };
}

interface Props {
  fileId: string;
  entry: Entry;
  selected: boolean;
  flash: boolean;
  onSelect: () => void;
}

export function EntryRow({ fileId, entry, selected, flash, onSelect }: Props) {
  const updateEntry = useStore((s) => s.updateEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const toggleLock = useStore((s) => s.toggleLock);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (flash) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [flash]);

  useEffect(() => {
    const ta = taRef.current;
    if (editing && ta) {
      ta.style.height = '0';
      ta.style.height = `${ta.scrollHeight + 2}px`;
    }
  }, [editing, draft]);

  const startEdit = () => {
    onSelect();
    if (entry.locked) return;
    setDraft(toSource(entry));
    setEditing(true);
  };

  const save = () => {
    setEditing(false);
    const { kind, text } = parseSource(draft);
    if (!text) return;
    updateEntry(fileId, entry.id, text, kind);
  };

  const q = entry.sourceItemId ? MODEL.questions.find((x) => x.id === entry.sourceItemId) : undefined;

  return (
    <div
      ref={ref}
      className={`entry ${entry.locked ? 'locked' : ''} ${selected ? 'selected' : ''} ${flash ? 'flash' : ''}`}
      data-entry={entry.id}
    >
      <div className="gutter">
        <ProvenanceIcon p={entry.provenance} />
        <button
          className={`lock-btn ${entry.locked ? 'on' : ''}`}
          title={entry.locked ? 'Locked — protected from automatic updates. Click to unlock.' : 'Lock this line'}
          aria-label={entry.locked ? 'Unlock line' : 'Lock line'}
          aria-pressed={entry.locked}
          onClick={() => toggleLock(fileId, entry.id)}
        >
          {entry.locked ? <Lock size={12} /> : <Unlock size={12} />}
        </button>
      </div>

      {editing ? (
        <div className="entry-edit">
          <textarea
            ref={taRef}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                save();
              }
              if (e.key === 'Escape') setEditing(false);
            }}
          />
          <div className="edit-hint">
            Enter to save · Esc to cancel · prefix <span className="mono">## </span>heading, <span className="mono">- </span>
            bullet, <span className="mono">&gt; </span>quote · saving marks the line human-written
          </div>
        </div>
      ) : (
        <div
          className={`entry-text ${entry.kind}`}
          onClick={startEdit}
          title={entry.locked ? 'Locked line — unlock to edit' : 'Click to edit'}
        >
          <RichText text={entry.text} />
        </div>
      )}

      <div className="entry-side">
        <span className="stamp" title={`Created ${fmtDateTime(entry.createdAt)} · Updated ${fmtDateTime(entry.updatedAt)}`}>
          {fmtDate(entry.updatedAt)}
        </span>
        {entry.sourceItemId && (
          <button
            className="chip mono link"
            style={{ border: 0 }}
            title={q ? `From assessment item ${q.id}: “${q.text}”` : entry.sourceItemId}
            onClick={() => q && openQuestionnaire(q.nodeId, q.id)}
          >
            {entry.sourceItemId}
          </button>
        )}
        {entry.locked ? (
          <span style={{ width: 22 }} />
        ) : (
          <button className="icon-btn" title="Delete line" onClick={() => deleteEntry(fileId, entry.id)}>
            <Trash2 size={12.5} />
          </button>
        )}
        <span className="sr-only">{PROVENANCE[entry.provenance].label}</span>
      </div>
    </div>
  );
}
