import { useState } from 'react';
import { useStore } from '../../store/store';
import { NODE_BY_ID } from '../../data/nodes';
import { useMaintenance } from '../../hooks/useMaintenance';
import { FLEXIBLE_AGE_DAYS, type RetakeSuggestion } from '../../logic/retakes';
import { fmtDate } from '../../logic/format';
import { Menu } from '../sidebar/Sidebar';
import { FloatShell } from './FloatingControls';

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
      <div className="row" style={{ marginBottom: 4 }}>
        <h4 className="grow" style={{ margin: 0 }}>{node.name}</h4>
        <span className="faint" style={{ fontSize: 11.5 }}>saved {fmtDate(s.lastCompleted)}</span>
      </div>
      <ul className="reasons">
        {s.reasons.map((r) => (
          <li key={r.text}>
            {r.ref ? (
              <a onClick={() => openFile(r.ref!.fileId, { entryId: r.ref!.entryId })}>{r.text}</a>
            ) : (
              r.text
            )}
          </li>
        ))}
      </ul>
      <div className="card-actions">
        <button className="btn sm primary" onClick={() => openQuestionnaire(s.nodeId)}>
          Retake
        </button>
        <button
          className="btn sm ghost"
          onClick={() => {
            setActiveTab(0);
            selectNode(s.nodeId);
          }}
        >
          Show
        </button>
        <button
          className="btn sm ghost"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setMenu({ x: r.left, y: r.bottom + 4 });
          }}
        >
          Later
        </button>
      </div>
      {menu && (
        <Menu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          {(
            [
              ['In 2 weeks', 14],
              ['In a month', 30],
              ['In 3 months', 90],
            ] as const
          ).map(([label, days]) => (
            <button
              key={label}
              className="menu-item"
              onClick={() => {
                setMenu(null);
                defer(s.nodeId, days);
              }}
            >
              {label}
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
    <FloatShell
      icon="★"
      title="Suggested retakes"
      sub={`Based on flexible answers older than ${FLEXIBLE_AGE_DAYS} days, answers you marked unsure, and notes that say something changed.`}
    >
      {retakes.length === 0 && <p className="muted" style={{ margin: 0 }}>Nothing to suggest right now.</p>}
      {retakes.map((s) => (
        <SuggestionCard key={s.nodeId} s={s} />
      ))}
      {deferredRetakes.length > 0 && (
        <div>
          <h4 className="section-label" style={{ marginTop: 6 }}>Later</h4>
          {deferredRetakes.map((s) => (
            <div key={s.nodeId} className="row" style={{ fontSize: 12.5, padding: '4px 0' }}>
              <span className="grow muted">{NODE_BY_ID[s.nodeId].name}</span>
              <span className="faint">{fmtDate(deferred[s.nodeId])}</span>
              <button className="btn sm ghost" onClick={() => undefer(s.nodeId)}>
                Undo
              </button>
            </div>
          ))}
        </div>
      )}
    </FloatShell>
  );
}
