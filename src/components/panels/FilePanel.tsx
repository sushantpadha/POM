import { ArrowRight, Lock } from 'lucide-react';
import type { Provenance } from '../../types';
import { useStore } from '../../store/store';
import { MODEL, nodesForFile } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { fmtDate, fmtDateTime } from '../../logic/format';
import { PROVENANCE, ProvenanceIcon, StatusPill } from '../branding';
import { FileActions } from './FileActions';

export function FilePanel({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const selected = useStore((s) => (s.selectedEntry?.fileId === fileId ? s.selectedEntry.entryId : null));
  const selectNode = useStore((s) => s.selectNode);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const toggleLock = useStore((s) => s.toggleLock);
  const { status } = useDerived();
  const entries = file.current.entries;
  const entry = entries.find((e) => e.id === selected);
  const counts = (p: Provenance) => entries.filter((e) => e.provenance === p).length;
  const q = entry?.sourceItemId ? MODEL.questions.find((x) => x.id === entry.sourceItemId) : undefined;

  return (
    <aside className="context-panel" aria-label="File details">
      <div className="cp-head">
        <div className="cp-branch">Notes file</div>
        <h2 className="cp-title mono" style={{ fontSize: 14 }}>{fileId}</h2>
        <div className="faint" style={{ fontSize: 12 }}>
          Current version from {fmtDate(file.current.createdAt)} · {file.history.length}/5 earlier versions kept
        </div>
      </div>
      <div className="cp-scroll">
        <section>
          <h4 className="section-label">Selected line</h4>
          {entry ? (
            <dl className="kv">
              <dt>Entry ID</dt>
              <dd className="mono" style={{ fontSize: 11.5 }}>{entry.id}</dd>
              <dt>Provenance</dt>
              <dd className="row" style={{ gap: 4 }}>
                <ProvenanceIcon p={entry.provenance} /> {PROVENANCE[entry.provenance].label}
              </dd>
              <dt>Created</dt>
              <dd>{fmtDateTime(entry.createdAt)}</dd>
              <dt>Last updated</dt>
              <dd>{fmtDateTime(entry.updatedAt)}</dd>
              <dt>Source item</dt>
              <dd>
                {q ? (
                  <button className="chip mono link" style={{ border: 0 }} onClick={() => openQuestionnaire(q.nodeId, q.id)} title={q.text}>
                    {q.id} <ArrowRight size={10} />
                  </button>
                ) : (
                  <span className="faint">None (not derived from a test item)</span>
                )}
              </dd>
              <dt>Lock</dt>
              <dd>
                <button className="btn sm" onClick={() => toggleLock(fileId, entry.id)}>
                  <Lock size={11} /> {entry.locked ? 'Locked — unlock' : 'Unlocked — lock'}
                </button>
              </dd>
            </dl>
          ) : (
            <p className="faint" style={{ margin: 0, fontSize: 12.5 }}>Click a line to see its ID, timestamps, provenance and source item.</p>
          )}
          {q && (
            <p className="metric-note" style={{ marginTop: 8 }}>“{q.text}”</p>
          )}
        </section>

        <section>
          <h4 className="section-label">Lines</h4>
          <dl className="kv">
            {(['human', 'auto', 'ai'] as Provenance[]).map((p) => (
              <FragmentRow key={p} p={p} n={counts(p)} />
            ))}
            <dt className="row" style={{ gap: 6 }}>
              <span className="prov" style={{ color: 'var(--chg)' }}><Lock size={12} /></span> Locked
            </dt>
            <dd>{entries.filter((e) => e.locked).length}</dd>
          </dl>
          <p className="metric-note" style={{ marginTop: 8 }}>
            Locked lines are kept verbatim by generated updates, summaries and topic resets.
          </p>
        </section>

        <section>
          <h4 className="section-label">Fed by questionnaires</h4>
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
                <StatusPill status={status[id]} branch={NODE_BY_ID[id].branch} />
                <span className="grow">{status[id] === 'locked' ? 'Undiscovered node' : NODE_BY_ID[id].name}</span>
                <ArrowRight size={13} />
              </button>
            ))}
          </div>
        </section>

        <FileActions fileId={fileId} />
      </div>
    </aside>
  );
}

function FragmentRow({ p, n }: { p: Provenance; n: number }) {
  return (
    <>
      <dt className="row" style={{ gap: 6 }}>
        <ProvenanceIcon p={p} size={12} /> {PROVENANCE[p].label}
      </dt>
      <dd>{n}</dd>
    </>
  );
}
