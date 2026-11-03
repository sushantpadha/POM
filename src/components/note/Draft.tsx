import type { FileVersion, Proposal } from '../../types';
import { diffVersions } from '../../logic/notes';
import { RichText } from './RichText';

/** Only what would change: new, changed and removed lines. Unchanged lines are left out. */
export function Changes({ from, to, protectedIds = [] }: { from: FileVersion; to: FileVersion | Proposal; protectedIds?: string[] }) {
  const rows = diffVersions(from, to).filter((r) => r.kind !== 'same' || protectedIds.includes(r.entry.id));
  if (!rows.length) return <p className="faint small">No changes.</p>;
  return (
    <div>
      {rows.map((r) => (
        <div key={`${r.kind}-${r.entry.id}`} className={`diff ${r.kind}`}>
          <RichText text={r.entry.text} />
          {r.kind === 'changed' && r.before && (
            <div className="was">
              <RichText text={r.before.text} />
            </div>
          )}
          {r.kind === 'same' && <div className="kept">Locked, kept as it is</div>}
        </div>
      ))}
    </div>
  );
}
