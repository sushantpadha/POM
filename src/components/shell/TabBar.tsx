import { ClipboardList, FileText, Network, Sparkles, X } from 'lucide-react';
import type { Tab } from '../../types';
import { useStore } from '../../store/store';
import { NODE_BY_ID } from '../../data/nodes';

function tabLabel(t: Tab): { label: string; Icon: typeof Network } {
  switch (t.kind) {
    case 'graph':
      return { label: 'Graph', Icon: Network };
    case 'file':
      return { label: t.fileId, Icon: FileText };
    case 'questionnaire':
      return { label: NODE_BY_ID[t.nodeId].name, Icon: ClipboardList };
    case 'onboarding':
      return { label: 'Who am I? — onboarding', Icon: Sparkles };
  }
}

export function TabBar() {
  const tabs = useStore((s) => s.tabs);
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const closeTab = useStore((s) => s.closeTab);
  const files = useStore((s) => s.files);

  return (
    <div className="tabbar" role="tablist">
      {tabs.map((t, i) => {
        const { label, Icon } = tabLabel(t);
        return (
          <div
            key={i}
            role="tab"
            aria-selected={i === activeTab}
            className={`tab ${i === activeTab ? 'active' : ''}`}
            onClick={() => setActiveTab(i)}
            onAuxClick={(e) => e.button === 1 && closeTab(i)}
          >
            <Icon size={13} />
            <span className="label">{label}</span>
            {t.kind === 'file' && files[t.fileId]?.proposal && <span className="badge-dot" title="Proposed update" />}
            {i > 0 && (
              <button
                className="close"
                aria-label="Close tab"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(i);
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
