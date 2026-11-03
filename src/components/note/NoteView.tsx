import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import type { Entry } from '../../types';
import { useStore } from '../../store/store';
import { MODEL, nodesForFile } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { DIRS } from '../../data/files';
import { diffStats, diffVersions } from '../../logic/notes';
import { fmtDate, fmtDateTime } from '../../logic/format';
import { BRANCH_LABEL, PROVENANCE, ProvenanceIcon } from '../branding';
import { Changes } from './Draft';
import { RichText } from './RichText';
import { parseSource, toSource } from './lines';

type Mode = 'read' | 'edit' | 'history';

export function NoteView({ fileId, mode = 'read' }: { fileId: string; mode?: Mode }) {
  const file = useStore((s) => s.files[fileId]);
  const aiEnabled = useStore((s) => s.aiEnabled);
  const go = useStore((s) => s.go);
  const setDialog = useStore((s) => s.setDialog);
  const proposeSummary = useStore((s) => s.proposeSummary);
  const toast = useStore((s) => s.toast);
  const openReflection = useStore((s) => s.openReflection);
  const setMode = (m: Mode) => go({ name: 'note', fileId, mode: m });

  const branch = NODE_BY_ID[DIRS.find((d) => d.id === file.dir)!.branch];
  const topics = nodesForFile(fileId);

  const summarise = () => {
    if (!proposeSummary(fileId)) {
      toast(file.name === 'main' ? 'Nothing to summarise yet: this area’s other notes are empty.' : 'Nothing to summarise: only lines made from your answers are summarised, and there are too few.');
    }
  };

  return (
    <div className="page">
      <button className="back" onClick={() => go({ name: 'journal' })}>
        ← Journal
      </button>
      <div className="note-head">
        <p className="faint small">{BRANCH_LABEL[branch.branch]}</p>
        <h1>{file.name === 'main' ? 'Overview' : file.title}</h1>
        <p className="faint small">Updated {fmtDate(file.current.createdAt)}</p>
      </div>

      <div className="toolbar">
        <button className={mode === 'edit' ? 'on' : ''} onClick={() => setMode(mode === 'edit' ? 'read' : 'edit')}>
          {mode === 'edit' ? 'Done' : 'Edit'}
        </button>
        <button className={mode === 'history' ? 'on' : ''} onClick={() => setMode(mode === 'history' ? 'read' : 'history')}>
          History
        </button>
        {aiEnabled && (
          <button onClick={summarise} disabled={!!file.proposal}>
            Summarise
          </button>
        )}
        <span className="sep" />
        <button onClick={() => setDialog({ kind: 'reset', fileId })}>Reset</button>
        <button onClick={() => setDialog({ kind: 'erase', fileId })}>Erase</button>
      </div>

      {file.proposal && <DraftBox fileId={fileId} />}

      {mode === 'history' ? (
        <History fileId={fileId} />
      ) : file.current.entries.length === 0 && mode === 'read' ? (
        <div className="empty">
          <p>{file.name === 'main' ? 'This is where a summary of this area goes. Write one yourself, or use Summarise once you have other notes here.' : 'No notes here yet.'}</p>
          {topics[0] && file.name !== 'main' && (
            <button className="btn" onClick={() => openReflection(topics[0])}>
              Start reflecting
            </button>
          )}
        </div>
      ) : (
        <Lines fileId={fileId} editing={mode === 'edit'} />
      )}

      {mode === 'read' && topics.length > 0 && file.current.entries.length > 0 && (
        <p className="note-small" style={{ marginTop: 36 }}>
          From your reflections in{' '}
          {topics.map((id, i) => (
            <span key={id}>
              {i > 0 && ', '}
              <a onClick={() => openReflection(id)}>{NODE_BY_ID[id].name}</a>
            </span>
          ))}
          .
        </p>
      )}
    </div>
  );
}

function DraftBox({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const commit = useStore((s) => s.commitProposal);
  const cancel = useStore((s) => s.cancelProposal);
  const p = file.proposal!;
  const isSummary = p.kind === 'summary';
  return (
    <div className="draft">
      <div className="draft-head">
        <h3>{isSummary ? 'Draft summary' : 'Draft from your answers'}</h3>
        {isSummary && <span className="ai-tag">AI</span>}
      </div>
      {isSummary && (
        <p className="note-small" style={{ marginBottom: 10 }}>
          Pre-written for the sample or made by a simple rule; there is no AI in this prototype. Your own and locked lines
          stay as they are.
        </p>
      )}
      <Changes from={file.current} to={p} protectedIds={isSummary ? [] : p.protectedIds} />
      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn primary small" onClick={() => commit(fileId)}>
          Save
        </button>
        <button className="btn small" onClick={() => cancel(fileId)}>
          Discard
        </button>
      </div>
    </div>
  );
}

function Lines({ fileId, editing }: { fileId: string; editing: boolean }) {
  const file = useStore((s) => s.files[fileId]);
  const highlight = useStore((s) => s.highlight);
  const addEntry = useStore((s) => s.addEntry);
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!editing) setSelected(null);
  }, [editing]);

  const add = () => {
    const { kind, text } = parseSource(draft);
    if (!text) return;
    addEntry(fileId, null, text, kind === 'p' ? 'li' : kind);
    setDraft('');
  };

  return (
    <div className={editing ? 'editing' : ''}>
      {file.current.entries.map((e) => (
        <Line
          key={e.id}
          fileId={fileId}
          entry={e}
          editing={editing}
          selected={selected === e.id}
          highlighted={highlight?.fileId === fileId && highlight.entryId === e.id}
          onSelect={() => setSelected(selected === e.id ? null : e.id)}
        />
      ))}
      {editing && (
        <input
          className="add-line"
          value={draft}
          placeholder="Add a line of your own"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          onBlur={add}
          aria-label="Add a line"
        />
      )}
    </div>
  );
}

function Line({
  fileId,
  entry,
  editing,
  selected,
  highlighted,
  onSelect,
}: {
  fileId: string;
  entry: Entry;
  editing: boolean;
  selected: boolean;
  highlighted: boolean;
  onSelect: () => void;
}) {
  const updateEntry = useStore((s) => s.updateEntry);
  const deleteEntry = useStore((s) => s.deleteEntry);
  const toggleLock = useStore((s) => s.toggleLock);
  const acceptEntry = useStore((s) => s.acceptEntry);
  const [text, setText] = useState(toSource(entry));
  const [details, setDetails] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const q = entry.sourceItemId ? MODEL.questions.find((x) => x.id === entry.sourceItemId) : undefined;
  // Headings in a summary are structure, not statements: no label or keep/remove on them.
  const isAi = entry.provenance === 'ai' && entry.kind !== 'h';

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: 'center' });
  }, [highlighted]);
  useEffect(() => setText(toSource(entry)), [entry]);

  const save = () => {
    const { kind, text: t } = parseSource(text);
    if (t) updateEntry(fileId, entry.id, t, kind);
  };

  const cls = `line ${entry.kind} ${isAi ? 'ai' : ''} ${entry.locked ? 'locked' : ''} ${selected ? 'sel' : ''} ${highlighted ? 'highlight' : ''}`;

  if (!editing) {
    return (
      <div ref={ref} className={cls} data-entry={entry.id}>
        <div className="txt">
          <RichText text={entry.text} />
          {isAi && <span className="ai-tag" title={PROVENANCE.ai.label}>AI</span>}
          {isAi && !entry.accepted && (
            <span className="ai-actions">
              <button className="link" onClick={() => acceptEntry(fileId, entry.id)}>
                Keep
              </button>
              <button className="link" onClick={() => deleteEntry(fileId, entry.id)}>
                Remove
              </button>
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={ref} className={cls} data-entry={entry.id} onClick={() => !selected && onSelect()}>
        <span className="meta-icon">{entry.locked ? <Lock size={13} color="var(--chg)" /> : <ProvenanceIcon p={entry.provenance} />}</span>
        {selected && !entry.locked ? (
          <textarea
            className="line-edit"
            autoFocus
            rows={Math.max(1, Math.ceil(text.length / 70))}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                save();
                onSelect();
              }
              if (e.key === 'Escape') onSelect();
            }}
          />
        ) : (
          <div className="txt">
            <RichText text={entry.text} />
            {isAi && <span className="ai-tag">AI</span>}
          </div>
        )}
      </div>
      {selected && (
        <>
          <div className="line-tools">
            <button className="link" onMouseDown={(e) => e.preventDefault()} onClick={() => toggleLock(fileId, entry.id)}>
              {entry.locked ? 'Unlock' : 'Lock'}
            </button>
            {!entry.locked && (
              <button className="link" onMouseDown={(e) => e.preventDefault()} onClick={() => deleteEntry(fileId, entry.id)}>
                Delete
              </button>
            )}
            <button className="link" onMouseDown={(e) => e.preventDefault()} onClick={() => setDetails(!details)}>
              {details ? 'Hide details' : 'Details'}
            </button>
            {entry.locked && <span>Locked lines are never changed automatically.</span>}
          </div>
          {details && (
            <div className="details">
              <span>Made by</span>
              <span>{PROVENANCE[entry.provenance].label}</span>
              {q && (
                <>
                  <span>From</span>
                  <span>
                    {q.id}: “{q.text}”
                  </span>
                </>
              )}
              <span>Created</span>
              <span>{fmtDateTime(entry.createdAt)}</span>
              <span>Updated</span>
              <span>{fmtDateTime(entry.updatedAt)}</span>
              <span>ID</span>
              <span className="mono">{entry.id}</span>
            </div>
          )}
        </>
      )}
    </>
  );
}

/** Plain words for the stored version reasons. */
function reasonLabel(reason: string): string {
  if (reason === 'Manual edit' || reason === 'Edited') return 'Your edits';
  if (reason.startsWith('Answers in ')) return `From your answers in ${reason.slice('Answers in '.length)}`;
  return reason;
}

/** Newest first. Each version shows what changed in it compared with the one before. */
function History({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const restore = useStore((s) => s.restoreVersion);
  const [open, setOpen] = useState<string | null>(file.current.versionId);
  // An empty starting version says nothing, so the timeline begins at the first note.
  const all = [...file.history, file.current];
  const chain = all.filter((v, i) => i > 0 || v.entries.length > 0);

  if (chain.length === 1) return <p className="empty">There are no earlier versions yet.</p>;

  return (
    <div className="timeline">
      {[...chain].reverse().map((v, ri) => {
        const i = chain.length - 1 - ri;
        const prev = chain[i - 1];
        const isCurrent = v === file.current;
        const st = prev ? diffStats(diffVersions(prev, v)) : null;
        return (
          <div key={v.versionId} className={`tl-item ${isCurrent ? 'current' : ''}`}>
            <button className="link when" style={{ color: 'var(--text)' }} onClick={() => setOpen(open === v.versionId ? null : v.versionId)}>
              {fmtDate(v.createdAt)}
              {isCurrent && <span className="faint"> · now</span>}
            </button>
            <div className="what">
              {reasonLabel(v.reason)}
              {st && ` · ${[st.added && `${st.added} added`, st.changed && `${st.changed} changed`, st.removed && `${st.removed} removed`].filter(Boolean).join(', ') || 'no line changes'}`}
            </div>
            {open === v.versionId && (
              <div className="tl-body">
                {prev ? <Changes from={prev} to={v} /> : <p className="faint small">The first version.</p>}
                {!isCurrent && (
                  <button className="link small" style={{ marginTop: 8 }} onClick={() => restore(fileId, v.versionId)}>
                    Go back to this version
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
