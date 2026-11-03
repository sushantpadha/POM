import { Lock } from 'lucide-react';
import type { Entry } from '../../types';
import type { DiffRow } from '../../logic/notes';
import { fmtDate } from '../../logic/format';
import { ProvenanceIcon } from '../branding';
import { RichText } from './RichText';

const SIGN = { added: '+', removed: '−', changed: '~', same: '' };

/** Read-only line, used by history and diff views. */
export function StaticEntry({ entry }: { entry: Entry }) {
  return (
    <div className={`entry ${entry.locked ? 'locked' : ''}`}>
      <div className="gutter">
        <ProvenanceIcon p={entry.provenance} />
        {entry.locked && (
          <span className="lock-btn on" title="Locked">
            <Lock size={12} />
          </span>
        )}
      </div>
      <div className={`entry-text ${entry.kind}`} style={{ cursor: 'default' }}>
        <RichText text={entry.text} />
      </div>
      <div className="entry-side">
        {entry.sourceItemId && <span className="chip mono">{entry.sourceItemId}</span>}
      </div>
    </div>
  );
}

export function DiffList({
  rows,
  protectedIds = [],
  showSame = true,
  showDates = false,
}: {
  rows: DiffRow[];
  protectedIds?: string[];
  showSame?: boolean;
  showDates?: boolean;
}) {
  const visible = showSame ? rows : rows.filter((r) => r.kind !== 'same' || protectedIds.includes(r.entry.id));
  if (!visible.length) return <p className="faint">No differences.</p>;
  return (
    <div>
      {visible.map((r) => {
        const isProtected = protectedIds.includes(r.entry.id);
        return (
          <div
            key={`${r.kind}-${r.entry.id}`}
            className={`diff-row ${r.kind} ${isProtected ? 'protected' : ''}`}
            data-diff={r.kind}
          >
            <span className="sign">{SIGN[r.kind]}</span>
            <div className="gutter">
              <ProvenanceIcon p={r.entry.provenance} />
              {r.entry.locked && (
                <span className="lock-btn on" title="Locked">
                  <Lock size={12} />
                </span>
              )}
            </div>
            <div>
              <div className={`entry-text ${r.entry.kind}`} style={{ cursor: 'default' }}>
                <RichText text={r.entry.text} />
              </div>
              {r.kind === 'changed' && r.before && (
                <div className="diff-before">
                  <RichText text={r.before.text} />
                </div>
              )}
            </div>
            <span className="diff-tag">
              {isProtected
                ? 'locked — kept unchanged'
                : showDates && r.kind === 'added'
                  ? `added ${fmtDate(r.entry.createdAt)}`
                  : showDates && r.kind === 'changed'
                    ? `changed ${fmtDate(r.entry.updatedAt)}`
                    : showDates && r.kind === 'removed'
                      ? 'removed'
                      : r.entry.sourceItemId ?? ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
