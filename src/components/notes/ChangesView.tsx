import { useState } from 'react';
import { Info } from 'lucide-react';
import { useStore } from '../../store/store';
import { diffStats, diffVersions } from '../../logic/notes';
import { fmtDate, fmtDateTime, relative } from '../../logic/format';
import { ProvenanceIcon } from '../branding';
import { RichText } from './RichText';

/** Changes over time within ONE file: a previous version compared with the current one. */
export function ChangesView({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const openFile = useStore((s) => s.openFile);
  const setFloating = useStore((s) => s.setFloating);
  const history = [...file.history].reverse(); // newest first
  const [baseId, setBaseId] = useState<string | undefined>(history[history.length - 1]?.versionId);
  const base = history.find((v) => v.versionId === baseId) ?? history[history.length - 1];

  if (!base) {
    return (
      <div className="empty">
        <h3>No earlier versions</h3>
        <p>Changes over time appear once this file has at least one earlier version.</p>
      </div>
    );
  }

  const rows = diffVersions(base, file.current).filter((r) => r.kind !== 'same');
  const stats = diffStats(rows);
  const chain = [...file.history, file.current];

  return (
    <div>
      <div className="callout" style={{ marginBottom: 14 }}>
        <Info size={14} />
        <span>
          Changes <b>within this file only</b>. Differences <em>between</em> files are shown under{' '}
          <a style={{ cursor: 'pointer' }} onClick={() => setFloating('tensions')}>potential tensions</a>.
        </span>
      </div>

      <h4 className="section-label">Compare current version with</h4>
      <div className="row wrap" style={{ gap: 6, marginBottom: 16 }}>
        {history.map((v) => (
          <button
            key={v.versionId}
            className={`btn sm ${v.versionId === base.versionId ? 'primary' : ''}`}
            onClick={() => setBaseId(v.versionId)}
            title={v.reason}
          >
            {fmtDate(v.createdAt)}
          </button>
        ))}
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <div className="grow" style={{ fontSize: 13 }}>
          Since <b>{fmtDateTime(base.createdAt)}</b> <span className="faint">({relative(base.createdAt)} · {base.reason})</span>
        </div>
        <div className="diff-stats">
          <span className="a">+{stats.added}</span>
          <span className="r">−{stats.removed}</span>
          <span className="c">~{stats.changed}</span>
        </div>
      </div>

      {rows.length === 0 && <p className="faint">No changes between these versions.</p>}
      {rows.map((r) => (
        <div
          key={`${r.kind}-${r.entry.id}`}
          className="change-card"
          style={{ borderLeft: `2px solid var(--${r.kind === 'added' ? 'add' : r.kind === 'removed' ? 'del' : 'chg'})` }}
        >
          <div className="when">
            <span style={{ color: `var(--${r.kind === 'added' ? 'add' : r.kind === 'removed' ? 'del' : 'chg'})`, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {r.kind}
            </span>
            <span>
              {r.kind === 'added' && `created ${fmtDateTime(r.entry.createdAt)}`}
              {r.kind === 'changed' && `updated ${fmtDateTime(r.entry.updatedAt)} · first written ${fmtDate(r.entry.createdAt)}`}
              {r.kind === 'removed' && `written ${fmtDate(r.entry.createdAt)} · no longer in the current version`}
            </span>
            <span className="grow" />
            <ProvenanceIcon p={r.entry.provenance} size={12} />
            {r.entry.sourceItemId && <span className="chip mono">{r.entry.sourceItemId}</span>}
          </div>
          {r.kind === 'changed' && r.before && (
            <div className="diff-before" style={{ paddingLeft: 0 }}>
              <RichText text={r.before.text} />
            </div>
          )}
          <div
            style={{ fontSize: 13.5, cursor: r.kind !== 'removed' ? 'pointer' : 'default', color: r.kind === 'removed' ? 'var(--text-dim)' : undefined, textDecoration: r.kind === 'removed' ? 'line-through' : undefined }}
            onClick={() => r.kind !== 'removed' && openFile(fileId, { entryId: r.entry.id })}
            title={r.kind !== 'removed' ? 'Show in current notes' : undefined}
          >
            <RichText text={r.entry.text} />
          </div>
        </div>
      ))}

      <h4 className="section-label" style={{ marginTop: 22 }}>Version timeline</h4>
      <div className="timeline">
        {chain.slice(1).map((v, i) => {
          const s = diffStats(diffVersions(chain[i], v));
          return (
            <div key={v.versionId} className="row" style={{ fontSize: 12.5, padding: '5px 0', borderBottom: '1px solid var(--border-soft)' }}>
              <span style={{ width: 150 }}>{fmtDateTime(v.createdAt)}</span>
              <span className="grow muted">{v.reason}{v === file.current && ' (current)'}</span>
              <span className="diff-stats">
                <span className="a">+{s.added}</span>
                <span className="r">−{s.removed}</span>
                <span className="c">~{s.changed}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
