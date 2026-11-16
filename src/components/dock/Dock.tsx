import type { ReactNode } from 'react';
import { MousePointerClick } from 'lucide-react';
import { useStore, type DockTab } from '../../store/store';
import { useMaintenance } from '../../hooks/useMaintenance';
import { NodePanel } from '../panels/NodePanel';
import { FilePanel } from '../panels/FilePanel';
import { AskPanel } from './AskPanel';
import { TensionsPanel } from './TensionsPanel';
import { RevisitPanel } from './RevisitPanel';

/** Body of a dock tab: an optional one-line explanation, a scrolling body and an optional footer. */
export function DockShell({ sub, children, foot }: { sub?: ReactNode; children: ReactNode; foot?: ReactNode }) {
  return (
    <>
      {sub && <div className="dock-sub">{sub}</div>}
      <div className="cp-scroll">{children}</div>
      {foot && <div className="dock-foot">{foot}</div>}
    </>
  );
}

function Details() {
  const tabs = useStore((s) => s.tabs);
  const activeTab = useStore((s) => s.activeTab);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const tab = tabs[activeTab] ?? tabs[0];
  if (tab.kind === 'file') return <FilePanel fileId={tab.fileId} />;
  if (tab.kind === 'graph' && selectedNodeId) return <NodePanel key={selectedNodeId} nodeId={selectedNodeId} />;
  return (
    <div className="dock-empty">
      <MousePointerClick size={18} />
      <p>Select an area on the map, or open a note, to see its details here.</p>
    </div>
  );
}

/**
 * The right-hand dock: one panel with four labelled tabs. It replaces the floating buttons and
 * panels of the first version. Every pane stays mounted so Ask keeps its conversation.
 */
export function Dock() {
  const dock = useStore((s) => s.dock);
  const setDock = useStore((s) => s.setDock);
  const { openTensions, retakes } = useMaintenance();
  const tabs: { id: DockTab; label: string; badge?: number }[] = [
    { id: 'details', label: 'Details' },
    { id: 'ask', label: 'Ask' },
    { id: 'tensions', label: 'Tensions', badge: openTensions.length },
    { id: 'revisit', label: 'Revisit', badge: retakes.length },
  ];
  const panes: Record<DockTab, ReactNode> = {
    details: <Details />,
    ask: <AskPanel />,
    tensions: <TensionsPanel />,
    revisit: <RevisitPanel />,
  };
  return (
    <aside className="context-panel dock" aria-label="Side panel">
      <div className="dock-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            data-tab={t.id}
            aria-selected={dock === t.id}
            className={`dock-tab ${dock === t.id ? 'sel' : ''}`}
            onClick={() => setDock(t.id)}
          >
            {t.label}
            {!!t.badge && <span className="dock-badge">{t.badge}</span>}
          </button>
        ))}
      </div>
      {(Object.keys(panes) as DockTab[]).map((id) => (
        <div key={id} className="dock-pane" data-pane={id} hidden={dock !== id} role="tabpanel">
          {panes[id]}
        </div>
      ))}
    </aside>
  );
}
