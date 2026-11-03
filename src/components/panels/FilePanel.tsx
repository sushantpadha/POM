import { Lock, Unlock } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL, nodesForFile } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { fmtDateTime } from '../../logic/format';
import { PROVENANCE, ProvenanceIcon, StatusDot } from '../branding';
import { FileActions } from './FileActions';

export function FilePanel({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const selected = useStore((s) => (s.selectedEntry?.fileId === fileId ? s.selectedEntry.entryId : null));
  const selectNode = useStore((s) => s.selectNode);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const toggleLock = useStore((s) => s.toggleLock);
  const { status } = useDerived();
  const entry = file.current.entries.find((e) => e.id === selected);
  const q = entry?.sourceItemId ? MODEL.questions.find((x) => x.id === entry.sourceItemId) : undefined;

  return (
    <aside className="context-panel" aria-label="File details">
      <div className="cp-head">
        <h2 className="cp-title mono" style={{ fontSize: 13.5, marginTop: 0 }}>{fileId}</h2>
        <div className="faint" style={{ fontSize: 12 }}>
          {file.history.length} earlier version{file.history.length === 1 ? '' : 's'} kept (up to 5)
        </div>
      </div>
      <div className="cp-scroll">
        <section>
          <h4 className="section-label">Line</h4>
          {entry ? (
            <>
              <dl className="kv">
                <dt>Made by</dt>
                <dd className="row" style={{ gap: 4 }}>
                  <ProvenanceIcon p={entry.provenance} /> {PROVENANCE[entry.provenance].label.split(' (')[0]}
                </dd>
                <dt>Created</dt>
                <dd>{fmtDateTime(entry.createdAt)}</dd>
                <dt>Updated</dt>
                <dd>{fmtDateTime(entry.updatedAt)}</dd>
                <dt>From question</dt>
                <dd>
                  {q ? (
                    <a onClick={() => openQuestionnaire(q.nodeId, q.id)} title={q.text}>
                      {q.id}
                    </a>
                  ) : (
                    <span className="faint">none</span>
                  )}
                </dd>
                <dt>ID</dt>
                <dd className="mono faint" style={{ fontSize: 11 }}>{entry.id}</dd>
              </dl>
              {q && <p className="metric-note" style={{ marginTop: 8 }}>“{q.text}”</p>}
              <button className="btn sm" style={{ marginTop: 10 }} onClick={() => toggleLock(fileId, entry.id)}>
                {entry.locked ? <Unlock size={11} /> : <Lock size={11} />} {entry.locked ? 'Unlock' : 'Lock'}
              </button>
              <p className="metric-note" style={{ marginTop: 6 }}>Locked lines are never changed by updates, summaries or resets.</p>
            </>
          ) : (
            <p className="faint" style={{ margin: 0, fontSize: 12.5 }}>Select a line to see where it came from.</p>
          )}
        </section>

        <section>
          <h4 className="section-label">Questions that write here</h4>
          <div className="link-list">
            {nodesForFile(fileId).map((id) => (
              <button
                key={id}
                className="link-row"
                onClick={() => {
                  setActiveTab(0);
                  selectNode(id);
                }}
              >
                <StatusDot status={status[id]} branch={NODE_BY_ID[id].branch} />
                <span className="grow">{status[id] === 'locked' ? 'Not opened yet' : NODE_BY_ID[id].name}</span>
              </button>
            ))}
          </div>
        </section>

        <FileActions fileId={fileId} />
      </div>
    </aside>
  );
}
