import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useStore } from '../../store/store';
import { nodesForFile } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { fmtDate } from '../../logic/format';
import { EntryRow, parseSource } from './EntryRow';
import { FileToolbar } from './FileToolbar';
import { ProposalView } from './ProposalView';
import { HistoryView } from './HistoryView';
import { ChangesView } from './ChangesView';

export function FileEditor({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const mode = useStore((s) => s.fileModes[fileId] ?? 'notes');
  const highlight = useStore((s) => s.highlight);
  const addEntry = useStore((s) => s.addEntry);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const selected = useStore((s) => (s.selectedEntry?.fileId === fileId ? s.selectedEntry.entryId : null));
  const selectEntry = useStore((s) => s.selectEntry);
  const [draft, setDraft] = useState('');
  const { status } = useDerived();

  const nodeIds = nodesForFile(fileId);
  const [dir, name] = fileId.split('/');

  const add = () => {
    const { kind, text } = parseSource(draft);
    if (!text) return;
    const id = addEntry(fileId, null, text, kind === 'p' ? 'li' : kind);
    setDraft('');
    selectEntry(fileId, id);
  };

  return (
    <div className="doc-scroll">
      <div className="file-head">
        <div className="crumbs">
          personal-model <ChevronRight size={11} /> {dir} <ChevronRight size={11} /> <span style={{ color: 'var(--text-dim)' }}>{name}</span>
        </div>
        <h1 className="file-title">{file.title}</h1>
        <div className="file-meta">
          <span>Updated {fmtDate(file.current.createdAt)}</span>
        </div>
        <FileToolbar fileId={fileId} />
      </div>

      <div className="file-body">
        {mode === 'history' ? (
          <HistoryView fileId={fileId} />
        ) : mode === 'changes' ? (
          <ChangesView fileId={fileId} />
        ) : file.proposal ? (
          <ProposalView fileId={fileId} />
        ) : (
          <>
            {file.current.entries.length === 0 ? (
              <div className="empty">
                <h3>No notes yet</h3>
                <p>
                  {name === 'main'
                    ? 'This file holds a summary of the topic files in this folder. Use Summarise once they have notes, or write your own below.'
                    : `Notes appear here when you save answers in ${nodeIds.map((id) => NODE_BY_ID[id].name).join(' or ')}. You can also write your own below.`}
                </p>
                {nodeIds
                  .filter((id) => status[id] !== 'locked')
                  .slice(0, 1)
                  .map((id) => (
                    <button key={id} className="btn" onClick={() => openQuestionnaire(id)}>
                      Answer {NODE_BY_ID[id].name}
                    </button>
                  ))}
                {nodeIds.every((id) => status[id] === 'locked') && (
                  <p className="faint" style={{ margin: 0 }}>Its questions are not open yet.</p>
                )}
              </div>
            ) : (
              <div className="entries">
                {file.current.entries.map((e) => (
                  <EntryRow
                    key={e.id}
                    fileId={fileId}
                    entry={e}
                    selected={selected === e.id}
                    flash={highlight?.fileId === fileId && highlight.entryId === e.id}
                    onSelect={() => selectEntry(fileId, e.id)}
                  />
                ))}
              </div>
            )}
            <div className="add-line">
              <span className="faint" style={{ fontSize: 11, textAlign: 'right' }}>new</span>
              <input
                value={draft}
                placeholder="Add your own note"
                title="Start with ## for a heading, - for a bullet, > for a quote"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                onBlur={add}
                aria-label="Add a note"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
