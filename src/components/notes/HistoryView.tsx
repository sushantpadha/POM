import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { useStore } from '../../store/store';
import { diffStats, diffVersions } from '../../logic/notes';
import { fmtDateTime } from '../../logic/format';
import { DiffList, StaticEntry } from './DiffList';

export function HistoryView({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const inspect = useStore((s) => s.inspectVersion[fileId]);
  const setInspect = useStore((s) => s.setInspectVersion);
  const restore = useStore((s) => s.restoreVersion);
  const [compare, setCompare] = useState(true);

  const versions = [file.current, ...[...file.history].reverse()];
  const selected = versions.find((v) => v.versionId === inspect) ?? versions[1] ?? versions[0];
  const isCurrent = selected.versionId === file.current.versionId;

  return (
    <div className="history">
      <div>
        <h4 className="section-label">Versions ({file.history.length} of 5 kept + current)</h4>
        <div className="version-list">
          {versions.map((v, i) => {
            const stats = i === 0 ? null : diffStats(diffVersions(v, file.current));
            return (
              <button
                key={v.versionId}
                className={`version ${v.versionId === selected.versionId ? 'sel' : ''}`}
                onClick={() => setInspect(fileId, v.versionId)}
              >
                <span className="d">
                  {fmtDateTime(v.createdAt)}
                  {i === 0 && <span className="chip" style={{ height: 17, color: 'var(--accent)' }}>current</span>}
                </span>
                <span className="r">{v.reason}</span>
                <span className="n">
                  {v.entries.length} lines
                  {stats && ` · vs current +${stats.added} −${stats.removed} ~${stats.changed}`}
                </span>
              </button>
            );
          })}
        </div>
        {file.history.length === 0 && <p className="faint" style={{ fontSize: 12 }}>No earlier versions yet.</p>}
        <p className="metric-note" style={{ marginTop: 10 }}>
          Versioning is per file. Committing an update moves the current version here; only the five most recent are kept.
        </p>
      </div>
      <div>
        <div className="row" style={{ marginBottom: 10 }}>
          <div className="grow">
            <div style={{ fontWeight: 500 }}>{isCurrent ? 'Current version' : `Version from ${fmtDateTime(selected.createdAt)}`}</div>
            <div className="faint" style={{ fontSize: 12 }}>{selected.reason}</div>
          </div>
          {!isCurrent && (
            <>
              <div className="seg">
                <button className={!compare ? 'sel' : ''} onClick={() => setCompare(false)}>View</button>
                <button className={compare ? 'sel' : ''} onClick={() => setCompare(true)}>Compare with current</button>
              </div>
              <button className="btn" onClick={() => restore(fileId, selected.versionId)} title="Creates a new current version with this content">
                <RotateCcw size={13} /> Restore
              </button>
            </>
          )}
        </div>
        {!isCurrent && compare ? (
          <>
            <p className="faint" style={{ fontSize: 12, margin: '0 0 8px' }}>
              <span style={{ color: 'var(--del)' }}>−</span> only in this version ·{' '}
              <span style={{ color: 'var(--add)' }}>+</span> only in current ·{' '}
              <span style={{ color: 'var(--chg)' }}>~</span> changed (old text struck through)
            </p>
            <DiffList rows={diffVersions(selected, file.current)} />
          </>
        ) : selected.entries.length ? (
          selected.entries.map((e) => <StaticEntry key={e.id} entry={e} />)
        ) : (
          <p className="faint">This version has no lines.</p>
        )}
      </div>
    </div>
  );
}
