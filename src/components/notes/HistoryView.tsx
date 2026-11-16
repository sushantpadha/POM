import { RotateCcw } from 'lucide-react';
import { useStore } from '../../store/store';
import { diffStats, diffVersions } from '../../logic/notes';
import { fmtDateTime, relative } from '../../logic/format';
import { DiffList, StaticEntry } from './DiffList';

/**
 * One History view for a file: its versions on the left; on the right, the selected version
 * compared with the current one, and a Restore button. (Replaces "History" and "Changes over time".)
 */
export function HistoryView({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const inspect = useStore((s) => s.inspectVersion[fileId]);
  const setInspect = useStore((s) => s.setInspectVersion);
  const restore = useStore((s) => s.restoreVersion);

  const versions = [file.current, ...[...file.history].reverse()];
  const selected = versions.find((v) => v.versionId === inspect) ?? versions[1] ?? versions[0];
  const isCurrent = selected.versionId === file.current.versionId;
  const rows = diffVersions(selected, file.current);
  const stats = diffStats(rows);

  return (
    <div className="history">
      <div>
        <h4 className="section-label">Versions</h4>
        <div className="version-list">
          {versions.map((v, i) => {
            const s = i === 0 ? null : diffStats(diffVersions(v, file.current));
            return (
              <button
                key={v.versionId}
                className={`version ${v.versionId === selected.versionId ? 'sel' : ''}`}
                onClick={() => setInspect(fileId, v.versionId)}
              >
                <span className="d">
                  {fmtDateTime(v.createdAt)}
                  {i === 0 && <span className="chip">current</span>}
                </span>
                <span className="r">{v.reason}</span>
                {s && <span className="n">vs current: +{s.added} −{s.removed} ~{s.changed}</span>}
              </button>
            );
          })}
        </div>
        <p className="metric-note" style={{ marginTop: 10 }}>
          The current version and the five before it are kept.
        </p>
      </div>
      <div>
        {isCurrent ? (
          <>
            <div className="history-head">
              <div className="grow">
                <div style={{ fontWeight: 500 }}>Current version</div>
                <div className="faint">{selected.reason}</div>
              </div>
            </div>
            {file.history.length === 0 && <p className="faint">No earlier versions yet. They appear as your answers and edits change this note.</p>}
            {selected.entries.map((e) => <StaticEntry key={e.id} entry={e} />)}
          </>
        ) : (
          <>
            <div className="history-head">
              <div className="grow">
                <div style={{ fontWeight: 500 }}>
                  Since {fmtDateTime(selected.createdAt)} <span className="faint">({relative(selected.createdAt)})</span>
                </div>
                <div className="faint">
                  {selected.reason} · <span>+{stats.added} added</span> · <span>−{stats.removed} removed</span> · <span>~{stats.changed} changed</span>
                </div>
              </div>
              <button className="btn" onClick={() => restore(fileId, selected.versionId)} title="Makes a new current version with this content">
                <RotateCcw size={13} /> Restore
              </button>
            </div>
            <p className="faint diff-key">
              − only in this version · + added since · ~ changed (old text struck through)
            </p>
            <DiffList rows={rows} />
          </>
        )}
      </div>
    </div>
  );
}
