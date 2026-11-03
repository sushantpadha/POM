import { X } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { useMaintenance } from '../../hooks/useMaintenance';
import { nodeMetrics } from '../../logic/graph';
import { fmtDate } from '../../logic/format';
import { BRANCH_COLOR, BRANCH_LABEL, StatusDot, StatusPill } from '../branding';

export function NodePanel({ nodeId, closable = true }: { nodeId: string; closable?: boolean }) {
  const node = NODE_BY_ID[nodeId];
  const { available, status, isNew } = useDerived();
  const { openTensions } = useMaintenance();
  const responses = useStore((s) => s.responses);
  const progress = useStore((s) => s.progress[nodeId]);
  const onboardedAt = useStore((s) => s.onboardedAt);
  const selectNode = useStore((s) => s.selectNode);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const openFile = useStore((s) => s.openFile);
  const setFloating = useStore((s) => s.setFloating);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const st = status[nodeId];
  const isRoot = nodeId === 'root';
  const m = nodeMetrics(MODEL, nodeId, available, responses);
  // Files this node's answers write to (Doc 2 maps each question to a file).
  const fileIds = [...new Set(MODEL.questionsByNode[nodeId].flatMap((q) => q.fileIds))];
  const qTags = new Set(MODEL.questionsByNode[nodeId].flatMap((q) => q.selfTags));
  const related = openTensions.filter((t) => t.fileIds.some((f) => fileIds.includes(f)) || t.rule.tags.some((tg) => qTags.has(tg)));
  const lastCompleted = isRoot ? onboardedAt : progress?.completedAt;
  const pct = m.ownTotal ? (m.ownAnswered / m.ownTotal) * 100 : 0;

  const goToNode = (id: string) => {
    setActiveTab(0);
    selectNode(id);
  };

  return (
    <aside className="context-panel" aria-label="Node details">
      <div className="cp-head">
        <div className="row">
          <span className="cp-branch" style={{ color: BRANCH_COLOR[node.branch] }}>
            {BRANCH_LABEL[node.branch]}
          </span>
          <span className="grow" />
          {closable && (
            <button className="icon-btn" title="Close" onClick={() => selectNode(null)}>
              <X size={15} />
            </button>
          )}
        </div>
        <h2 className="cp-title">{st === 'locked' ? 'Not opened yet' : node.name}</h2>
        <div className="row">
          <StatusPill status={st} branch={node.branch} />
          {isNew(nodeId) && <span className="faint">· new</span>}
        </div>
      </div>

      <div className="cp-scroll">
        {st === 'locked' ? (
          <section>
            <p className="cp-desc">Answer any one of these questions to open it:</p>
            <div className="link-list" style={{ marginTop: 8 }}>
              {MODEL.questions
                .filter((q) => q.selfTags.some((t) => node.parentTags.includes(t)))
                .map((q) => (
                  <button key={q.id} className="link-row" disabled={!available.has(q.nodeId)} onClick={() => openQuestionnaire(q.nodeId, q.id)}>
                    <span className="mono faint" style={{ width: 34 }}>{q.id}</span>
                    <span className="grow">{NODE_BY_ID[q.nodeId].name}</span>
                    {!available.has(q.nodeId) && <span className="faint">not open</span>}
                  </button>
                ))}
            </div>
          </section>
        ) : (
          <>
            <p className="cp-desc">{node.description}</p>

            {!isRoot && (
              <section className="metric">
                <div className="metric-head">
                  <span>{m.ownAnswered} of {m.ownTotal} answered</span>
                  <span>{lastCompleted ? `saved ${fmtDate(lastCompleted)}` : 'not saved yet'}</span>
                </div>
                <div className="progress">
                  <span style={{ width: `${pct}%`, background: BRANCH_COLOR[node.branch] }} />
                </div>
                {m.discoveredNodes > 0 && (
                  <div className="metric-note">
                    Including what it opened: {m.subAnswered} of {m.subAvailable} questions answered across {m.discoveredNodes + 1} areas.
                  </div>
                )}
              </section>
            )}
            {isRoot && lastCompleted && <p className="metric-note">Consent given {fmtDate(lastCompleted)}.</p>}

            {closable && (
            <button className="btn primary block" onClick={() => openQuestionnaire(nodeId)}>
              {isRoot
                ? onboardedAt
                  ? 'Review onboarding'
                  : 'Start'
                : progress?.completedAt
                  ? 'Retake'
                  : st === 'in-progress'
                    ? 'Continue'
                    : 'Answer questions'}
            </button>
            )}

            {MODEL.children[nodeId].length > 0 && (
              <section>
                <h4 className="section-label">Leads to</h4>
                <div className="link-list">
                  {MODEL.children[nodeId].map((c) => {
                    const cn = NODE_BY_ID[c];
                    const locked = status[c] === 'locked';
                    return (
                      <button key={c} className="link-row" onClick={() => goToNode(c)}>
                        <StatusDot status={status[c]} branch={cn.branch} />
                        <span className={`grow ${locked ? 'faint' : ''}`}>{locked ? 'Not opened yet' : cn.name}</span>
                        {isNew(c) && <span className="faint">new</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {fileIds.length > 0 && (
              <section>
                <h4 className="section-label">Notes</h4>
                <div className="link-list">
                  {fileIds.map((f) => (
                    <button key={f} className="link-row" onClick={() => openFile(f, { mode: 'notes' })}>
                      <span className="grow mono" style={{ fontSize: 12 }}>{f}</span>
                    </button>
                  ))}
                  <button className="link-row" onClick={() => openFile(fileIds[0], { mode: 'changes' })}>
                    <span className="grow">Changes over time</span>
                  </button>
                  <button className="link-row" onClick={() => setFloating('tensions', nodeId)}>
                    <span className="grow">Potential tensions</span>
                    <span className="faint">{related.length}</span>
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
