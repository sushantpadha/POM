import { X } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { NODE_BY_ID, START_HERE } from '../../data/nodes';
import { FILE_DEF_BY_ID } from '../../data/files';
import { useDerived } from '../../hooks/useDerived';
import { nodeMetrics } from '../../logic/graph';
import { fmtDate } from '../../logic/format';
import { BRANCH_COLOR, BRANCH_LABEL, StatusDot, StatusPill } from '../branding';

/** Details tab for an area on the map. */
export function NodePanel({ nodeId }: { nodeId: string }) {
  const node = NODE_BY_ID[nodeId];
  const { available, status, isNew } = useDerived();
  const responses = useStore((s) => s.responses);
  const progress = useStore((s) => s.progress[nodeId]);
  const onboardedAt = useStore((s) => s.onboardedAt);
  const selectNode = useStore((s) => s.selectNode);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const openFile = useStore((s) => s.openFile);

  const st = status[nodeId];
  const isRoot = nodeId === 'root';
  const m = nodeMetrics(MODEL, nodeId, available, responses);
  const fileIds = [...new Set(MODEL.questionsByNode[nodeId].flatMap((q) => q.fileIds))];
  const lastCompleted = isRoot ? onboardedAt : progress?.completedAt;
  const pct = m.ownTotal ? (m.ownAnswered / m.ownTotal) * 100 : 0;
  const startHere = nodeId === START_HERE && !MODEL.questionsByNode[nodeId].some((q) => responses[q.id]);

  return (
    <>
      <div className="cp-head">
        <div className="row">
          <span className="cp-branch">
            <span className="dir-dot" style={{ background: BRANCH_COLOR[node.branch] }} />
            {BRANCH_LABEL[node.branch]}
          </span>
          <span className="grow" />
          <button className="icon-btn" title="Close" aria-label="Close details" onClick={() => selectNode(null)}>
            <X size={15} />
          </button>
        </div>
        <h2 className="cp-title">{st === 'locked' ? 'Not opened yet' : node.name}</h2>
        <div className="row">
          <StatusPill status={st} branch={node.branch} />
          {isNew(nodeId) && <span className="new-tag">new</span>}
          {startHere && <span className="new-tag">start here</span>}
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
                    <span className="mono faint" style={{ width: 38 }}>{q.id}</span>
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
                  <span>
                    {m.ownAnswered} of {m.ownTotal} answered
                  </span>
                  <span>{lastCompleted ? `done ${fmtDate(lastCompleted)}` : 'not done yet'}</span>
                </div>
                <div className="progress">
                  <span style={{ width: `${pct}%`, background: BRANCH_COLOR[node.branch] }} />
                </div>
              </section>
            )}
            {isRoot && lastCompleted && <p className="metric-note">Consent given {fmtDate(lastCompleted)}.</p>}

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

            {MODEL.children[nodeId].length > 0 && (
              <section>
                <h4 className="section-label">Leads to</h4>
                <div className="link-list">
                  {MODEL.children[nodeId].map((c) => {
                    const cn = NODE_BY_ID[c];
                    const locked = status[c] === 'locked';
                    return (
                      <button key={c} className="link-row" onClick={() => selectNode(c)}>
                        <StatusDot status={status[c]} branch={cn.branch} />
                        <span className={`grow ${locked ? 'faint' : ''}`}>{locked ? 'Not opened yet' : cn.name}</span>
                        {isNew(c) && <span className="new-tag">new</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {fileIds.length > 0 && (
              <section>
                <h4 className="section-label">{fileIds.length > 1 ? 'Notes' : 'Note'}</h4>
                <div className="link-list">
                  {fileIds.map((f) => (
                    <button key={f} className="link-row" onClick={() => openFile(f, { mode: 'notes' })}>
                      <span className="grow">{FILE_DEF_BY_ID[f].title}</span>
                      <span className="faint mono" style={{ fontSize: 12 }}>{f}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </>
  );
}
