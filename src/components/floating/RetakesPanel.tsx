import { useState } from 'react';
import { AlertTriangle, Clock, Gauge, Hand, Network, RotateCw, Undo2 } from 'lucide-react';
import { useStore } from '../../store/store';
import { NODE_BY_ID } from '../../data/nodes';
import { useMaintenance } from '../../hooks/useMaintenance';
import type { RetakeReasonKind, RetakeSuggestion } from '../../logic/retakes';
import { fmtDate } from '../../logic/format';
import { BRANCH_COLOR } from '../branding';
import { Menu } from '../sidebar/Sidebar';
import { FloatShell } from './FloatingControls';

const REASON_ICON: Record<RetakeReasonKind, typeof Clock> = {
  'user-reported': Hand,
  'flexible-age': Clock,
  'low-confidence': Gauge,
  tension: AlertTriangle,
};

function SuggestionCard({ s }: { s: RetakeSuggestion }) {
  const openQuestionnaire = useStore((st) => st.openQuestionnaire);
  const selectNode = useStore((st) => st.selectNode);
  const setActiveTab = useStore((st) => st.setActiveTab);
  const openFile = useStore((st) => st.openFile);
  const defer = useStore((st) => st.deferRetake);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const node = NODE_BY_ID[s.nodeId];

  return (
    <div className="card" data-retake={s.nodeId}>
      <div className="row" style={{ marginBottom: 6 }}>
        <span className="status-dot answered" style={{ color: BRANCH_COLOR[node.branch], width: 7, height: 7 }} />
        <h4 className="grow" style={{ margin: 0 }}>{node.name}</h4>
        <span className="faint" style={{ fontSize: 11.5 }}>last {fmtDate(s.lastCompleted)}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {s.reasons.map((r) => {
          const Icon = REASON_ICON[r.kind];
          return (
            <div key={r.text} className="row" style={{ alignItems: 'flex-start', fontSize: 12.5, color: 'var(--text-dim)' }}>
              <Icon size={13} style={{ flex: 'none', marginTop: 3, color: r.kind === 'user-reported' ? 'var(--human)' : 'var(--text-faint)' }} />
              <span
                style={r.ref ? { cursor: 'pointer' } : undefined}
                onClick={() => r.ref && openFile(r.ref.fileId, { entryId: r.ref.entryId })}
              >
                {r.text}
              </span>
            </div>
          );
        })}
      </div>
      <div className="card-actions">
        <button
          className="btn sm"
          onClick={() => {
            setActiveTab(0);
            selectNode(s.nodeId);
          }}
        >
          <Network size={12} /> Open
        </button>
        <button className="btn sm primary" onClick={() => openQuestionnaire(s.nodeId)}>
          <RotateCw size={12} /> Retake
        </button>
        <button
          className="btn sm ghost"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setMenu({ x: r.left, y: r.bottom + 4 });
          }}
        >
          <Clock size={12} /> Defer
        </button>
      </div>
      {menu && (
        <Menu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          {[
            ['2 weeks', 14],
            ['1 month', 30],
            ['3 months', 90],
          ].map(([label, days]) => (
            <button
              key={label}
              className="menu-item"
              onClick={() => {
                setMenu(null);
                defer(s.nodeId, days as number);
              }}
            >
              <Clock size={13} /> Remind me in {label}
            </button>
          ))}
        </Menu>
      )}
    </div>
  );
}

export function RetakesPanel() {
  const { retakes, deferredRetakes } = useMaintenance();
  const deferred = useStore((s) => s.deferred);
  const undefer = useStore((s) => s.undeferRetake);

  return (
    <FloatShell icon="★" title="Suggested retakes" sub="Questionnaires that may benefit from reassessment">
      {retakes.length === 0 && (
        <div className="empty" style={{ padding: 20 }}>
          <h3>Nothing to suggest right now</h3>
          <p>Suggestions appear when flexible answers age, confidence is low, or your notes say something changed.</p>
        </div>
      )}
      {retakes.map((s) => (
        <SuggestionCard key={s.nodeId} s={s} />
      ))}
      {deferredRetakes.length > 0 && (
        <div>
          <h4 className="section-label" style={{ marginTop: 6 }}>Deferred</h4>
          {deferredRetakes.map((s) => (
            <div key={s.nodeId} className="row" style={{ fontSize: 12.5, padding: '4px 0' }}>
              <span className="grow muted">{NODE_BY_ID[s.nodeId].name}</span>
              <span className="faint">until {fmtDate(deferred[s.nodeId])}</span>
              <button className="btn sm ghost" onClick={() => undefer(s.nodeId)}>
                <Undo2 size={12} /> Undo
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="faint" style={{ fontSize: 11.5 }}>
        Retaking never erases earlier answers: previous values are kept in each answer’s history and in the file’s versions.
      </div>
    </FloatShell>
  );
}
