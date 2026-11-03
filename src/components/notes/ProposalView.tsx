import { useState } from 'react';
import { Bot, Check, Pencil, X } from 'lucide-react';
import { useStore } from '../../store/store';
import { diffStats, diffVersions } from '../../logic/notes';
import { DiffList } from './DiffList';

export function ProposalView({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const commit = useStore((s) => s.commitProposal);
  const cancel = useStore((s) => s.cancelProposal);
  const [changesOnly, setChangesOnly] = useState(false);
  const proposal = file.proposal!;
  const rows = diffVersions(file.current, proposal);
  const stats = diffStats(rows);
  const isSummary = proposal.kind === 'summary';

  return (
    <div>
      <div className="proposal-bar" role="region" aria-label="Proposed update">
        {isSummary ? <Bot size={17} style={{ color: 'var(--ai)' }} /> : <Pencil size={16} style={{ color: 'var(--auto)' }} />}
        <div className="t">
          <b>{isSummary ? 'Draft summary' : `Draft changes — ${proposal.reason}`}</b>
          Nothing changes until you commit. The current version is kept in history.
          {proposal.protectedIds.length > 0 && ` ${proposal.protectedIds.length} line${proposal.protectedIds.length > 1 ? 's' : ''} kept as written.`}
        </div>
        <button className="btn" onClick={() => cancel(fileId)}>
          <X size={13} /> Cancel
        </button>
        <button className="btn primary" onClick={() => commit(fileId)}>
          <Check size={13} /> Commit
        </button>
      </div>
      {isSummary && (
        <div className="disclaimer" style={{ marginBottom: 8 }}>
          <Bot size={13} style={{ flex: 'none', marginTop: 1 }} />
          In a full version an AI would write this; here it is pre-written for the sample or made by a simple rule. It can lose
          detail. Your own lines and locked lines are not touched.
        </div>
      )}
      <div className="row" style={{ margin: '10px 0' }}>
        <div className="diff-stats">
          <span className="a">+{stats.added} added</span>
          <span className="r">−{stats.removed} removed</span>
          <span className="c">~{stats.changed} changed</span>
        </div>
        <span className="grow" />
        <div className="seg">
          <button className={!changesOnly ? 'sel' : ''} onClick={() => setChangesOnly(false)}>Whole file</button>
          <button className={changesOnly ? 'sel' : ''} onClick={() => setChangesOnly(true)}>Changes only</button>
        </div>
      </div>
      <DiffList rows={rows} protectedIds={proposal.protectedIds} showSame={!changesOnly} />
    </div>
  );
}
