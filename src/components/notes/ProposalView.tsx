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
          <b>{isSummary ? 'Proposed AI summary (simulated)' : `Proposed update — ${proposal.reason}`}</b>
          Preview only. <em>Commit</em> makes this the current version and moves the current one into history (5 kept).
          {proposal.protectedIds.length > 0 && ` ${proposal.protectedIds.length} locked line${proposal.protectedIds.length > 1 ? 's are' : ' is'} kept exactly as written.`}
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
          Summaries are AI-style interpretations and may drop nuance or be wrong. This prototype uses predefined or rule-based output.
          Lock any line you want preserved before committing.
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
          <button className={!changesOnly ? 'sel' : ''} onClick={() => setChangesOnly(false)}>Full proposed file</button>
          <button className={changesOnly ? 'sel' : ''} onClick={() => setChangesOnly(true)}>Changes only</button>
        </div>
      </div>
      <DiffList rows={rows} protectedIds={proposal.protectedIds} showSame={!changesOnly} />
    </div>
  );
}
