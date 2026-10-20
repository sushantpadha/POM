import { AlertTriangle, ArrowRight, FileText, GitCompare, History, Play, RotateCw, X } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { useMaintenance } from '../../hooks/useMaintenance';
import { descendants, nodeMetrics } from '../../logic/graph';
import { fmtDate, plural, relative } from '../../logic/format';
import { BRANCH_COLOR, BRANCH_LABEL, StatusPill } from '../branding';

export function NodePanel({ nodeId, closable = true }: { nodeId: string; closable?: boolean }) {
  const node = NODE_BY_ID[nodeId];
  const { available, status, tags, isNew } = useDerived();
  const { openTensions } = useMaintenance();
  const responses = useStore((s) => s.responses);
  const progress = useStore((s) => s.progress[nodeId]);
  const onboardedAt = useStore((s) => s.onboardedAt);
  const files = useStore((s) => s.files);
  const selectNode = useStore((s) => s.selectNode);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const openFile = useStore((s) => s.openFile);
  const setFloating = useStore((s) => s.setFloating);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const st = status[nodeId];
  const m = nodeMetrics(MODEL, nodeId, available, responses);
  const isRoot = nodeId === 'root';
  const file = node.fileId ? files[node.fileId] : undefined;
  const qTags = new Set(MODEL.questionsByNode[nodeId].flatMap((q) => q.selfTags));
  const related = openTensions.filter(
    (t) => (node.fileId && t.fileIds.includes(node.fileId)) || t.rule.tags.some((tg) => qTags.has(tg)),
  );
  const matchedParentTags = node.parentTags.filter((t) => tags.has(t));
  const children = MODEL.children[nodeId];
  const ownPct = m.ownTotal ? (m.ownAnswered / m.ownTotal) * 100 : 0;
  const subPct = m.subAvailable ? (m.subAnswered / m.subAvailable) * 100 : 0;
  const lastCompleted = isRoot ? onboardedAt : progress?.completedAt;

  const goToNode = (id: string) => {
    setActiveTab(0);
    selectNode(id);
  };

  return (
    <aside className="context-panel" aria-label="Node details">
      <div className="cp-head">
        <div className="row">
          <span className="cp-branch">
            <span className="status-dot answered" style={{ color: BRANCH_COLOR[node.branch], width: 7, height: 7 }} />
            {BRANCH_LABEL[node.branch]}
          </span>
          <span className="grow" />
          {closable && (
            <button className="icon-btn" title="Close panel" onClick={() => selectNode(null)}>
              <X size={15} />
            </button>
          )}
        </div>
        <h2 className="cp-title">{st === 'locked' ? 'Undiscovered node' : node.name}</h2>
        <div className="row wrap">
          <span className="chip tag">#{node.tag}</span>
          <StatusPill status={st} branch={node.branch} />
          {isNew(nodeId) && <span className="chip" style={{ color: 'var(--accent)' }}>Newly unlocked</span>}
        </div>
      </div>

      <div className="cp-scroll">
        {st === 'locked' ? (
          <section>
            <p className="cp-desc">
              This node has not been discovered yet. It appears when you answer any question carrying one of these tags:
            </p>
            <div className="row wrap" style={{ marginTop: 10 }}>
              {node.parentTags.map((t) => (
                <span key={t} className="chip tag">#{t}</span>
              ))}
            </div>
            <p className="metric-note" style={{ marginTop: 10 }}>Any one tag is enough. Questions that carry them:</p>
            <div className="link-list" style={{ marginTop: 6 }}>
              {MODEL.questions
                .filter((q) => q.selfTags.some((t) => node.parentTags.includes(t)))
                .map((q) => (
                  <button
                    key={q.id}
                    className="link-row"
                    disabled={!available.has(q.nodeId)}
                    onClick={() => openQuestionnaire(q.nodeId, q.id)}
                  >
                    <span className="chip mono">{q.id}</span>
                    <span className="grow">{NODE_BY_ID[q.nodeId].name}</span>
                    {available.has(q.nodeId) ? <ArrowRight size={13} /> : <span className="faint">locked</span>}
                  </button>
                ))}
            </div>
          </section>
        ) : (
          <>
            <p className="cp-desc">{node.description}</p>

            <dl className="kv">
              <dt>Last completed</dt>
              <dd>
                {lastCompleted ? (
                  <>
                    {fmtDate(lastCompleted)} <span className="faint">· {relative(lastCompleted)}</span>
                  </>
                ) : (
                  <span className="faint">Not yet completed</span>
                )}
              </dd>
              {!isRoot && (
                <>
                  <dt>Submissions</dt>
                  <dd>{progress?.submissions.length ?? 0}</dd>
                </>
              )}
              {!isRoot && (
                <>
                  <dt>Unlocked via</dt>
                  <dd className="row wrap" style={{ gap: 4 }}>
                    {matchedParentTags.map((t) => (
                      <span key={t} className="chip tag">#{t}</span>
                    ))}
                    {node.parentTags.length > matchedParentTags.length && (
                      <span className="faint" style={{ fontSize: 11.5 }}>
                        (also reachable via {node.parentTags.filter((t) => !tags.has(t)).map((t) => `#${t}`).join(', ')})
                      </span>
                    )}
                  </dd>
                </>
              )}
            </dl>

            {!isRoot && (
              <section className="metric">
                <div className="metric-head">
                  <span>This questionnaire</span>
                  <span>
                    {m.ownAnswered} / {m.ownTotal} answered
                  </span>
                </div>
                <div className="progress">
                  <span style={{ width: `${ownPct}%`, background: BRANCH_COLOR[node.branch] }} />
                </div>
                <div className="metric-note">Every question is optional — skipped questions are simply not recorded.</div>
              </section>
            )}

            {(!isRoot || onboardedAt) && (<>
            <section className="metric">
              <div className="metric-head">
                <span>Current progress</span>
                <span>
                  {m.subAnswered} / {m.subAvailable} available questions
                </span>
              </div>
              <div className="progress">
                <span style={{ width: `${subPct}%` }} />
              </div>
              <div className="metric-note">
                Across this node and its {plural(m.discoveredNodes, 'discovered descendant')}. Measured against what is
                available now — not against a fixed total.
              </div>
            </section>

            <section className="metric">
              <div className="metric-head">
                <span>Exploration</span>
                <span>
                  +{m.discoveredNodes} nodes · +{m.discoveredQuestions} questions
                </span>
              </div>
              <div className="metric-note">
                {m.discoveredNodes
                  ? 'Discovered through your answers. New questions widen the map; they never take progress away.'
                  : 'Answering questions here can open new paths.'}
                {m.undiscoveredNodes > 0 && ' More paths may still open.'}
              </div>
            </section>
            </>)}

            {children.length > 0 && (
              <section>
                <h4 className="section-label">Leads to</h4>
                <div className="link-list">
                  {children.map((c) => {
                    const cn = NODE_BY_ID[c];
                    const locked = status[c] === 'locked';
                    return (
                      <button key={c} className="link-row" onClick={() => goToNode(c)}>
                        <StatusPill status={status[c]} branch={cn.branch} />
                        <span className={`grow ${locked ? 'faint' : ''}`}>
                          {locked ? `via #${cn.parentTags.join(' or #')}` : cn.name}
                        </span>
                        {isNew(c) && <span className="badge-dot" title="Newly unlocked" />}
                      </button>
                    );
                  })}
                </div>
                {descendants(MODEL, nodeId).size > children.length && (
                  <div className="metric-note" style={{ marginTop: 4 }}>
                    {descendants(MODEL, nodeId).size} descendants in total, some reachable through other branches.
                  </div>
                )}
              </section>
            )}

            <section className="cp-actions">
              {isRoot ? (
                <button className="btn primary block" onClick={() => openQuestionnaire('root')}>
                  <Play size={13} /> {onboardedAt ? 'Review onboarding & consent' : 'Begin onboarding'}
                </button>
              ) : (
                <button className="btn primary block" onClick={() => openQuestionnaire(nodeId)}>
                  {progress?.completedAt ? <RotateCw size={13} /> : <Play size={13} />}
                  {progress?.completedAt ? 'Retake questionnaire' : st === 'in-progress' ? 'Continue questionnaire' : 'Take questionnaire'}
                </button>
              )}
            </section>

            {file && (
              <section>
                <h4 className="section-label">Notes & maintenance</h4>
                <div className="link-list">
                  <button className="link-row" onClick={() => openFile(file.id, { mode: 'notes' })}>
                    <FileText size={14} />
                    <span className="grow mono" style={{ fontSize: 12 }}>{file.id}</span>
                    <span className="faint">{file.current.entries.length} lines</span>
                  </button>
                  <button className="link-row" onClick={() => openFile(file.id, { mode: 'changes' })}>
                    <GitCompare size={14} />
                    <span className="grow">Changes over time</span>
                    <span className="faint">{plural(file.history.length, 'version')}</span>
                  </button>
                  <button className="link-row" onClick={() => openFile(file.id, { mode: 'history' })}>
                    <History size={14} />
                    <span className="grow">Version history</span>
                  </button>
                  <button className="link-row" onClick={() => setFloating('tensions', nodeId)}>
                    <AlertTriangle size={14} />
                    <span className="grow">Potential tensions with related notes</span>
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
