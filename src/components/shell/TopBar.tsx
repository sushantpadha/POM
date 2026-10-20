import { useState } from 'react';
import { Info, Network, RefreshCcw, UserRound, Sprout } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { useDerived } from '../../hooks/useDerived';
import { globalExploration } from '../../logic/graph';
import { Menu } from '../sidebar/Sidebar';

export function TopBar() {
  const profile = useStore((s) => s.profile);
  const responses = useStore((s) => s.responses);
  const chooseProfile = useStore((s) => s.chooseProfile);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setDialog = useStore((s) => s.setDialog);
  const activeTab = useStore((s) => s.activeTab);
  const { available } = useDerived();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const exploration = globalExploration(MODEL, available);

  const switchTo = (p: 'fresh' | 'sample') => {
    setMenu(null);
    if (window.confirm(`Replace the current demo state with ${p === 'sample' ? 'the sample profile' : 'a fresh start'}? Local demo data will be overwritten.`)) {
      chooseProfile(p);
    }
  };

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">
          <Network size={12} />
        </span>
        Personal Operating Model <small>prototype</small>
      </div>
      <button className={`btn ${activeTab === 0 ? '' : 'ghost'} sm`} onClick={() => setActiveTab(0)}>
        <Network size={13} /> Graph
      </button>
      <div className="spacer" />
      <span className="topbar-stat">
        <b>{Object.keys(responses).length}</b> answers
      </span>
      <span className="topbar-sep" />
      <span className="topbar-stat" title="Nodes and questions discovered through your answers (beyond the starting map)">
        Exploration <b>+{exploration.nodes}</b> nodes · <b>+{exploration.questions}</b> questions
      </span>
      <span className="topbar-sep" />
      <button className="icon-btn" title="Data, storage & consent" onClick={() => setDialog({ kind: 'about' })}>
        <Info size={15} />
      </button>
      <button
        className="profile-pill"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setMenu({ x: r.right - 240, y: r.bottom + 6 });
        }}
      >
        <span className="avatar">{profile === 'sample' ? 'PK' : <UserRound size={11} />}</span>
        {profile === 'sample' ? 'Priya · sample profile' : 'Fresh start'}
      </button>
      {menu && (
        <Menu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          <div className="menu-note">Demo data (stored in this browser)</div>
          <button className="menu-item" onClick={() => switchTo('sample')}>
            <UserRound size={14} /> Load sample profile (Priya)
          </button>
          <button className="menu-item" onClick={() => switchTo('fresh')}>
            <Sprout size={14} /> Fresh start — from onboarding
          </button>
          <div className="menu-sep" />
          <button className="menu-item danger" onClick={() => switchTo(profile === 'sample' ? 'sample' : 'fresh')}>
            <RefreshCcw size={14} /> Reset this demo
          </button>
        </Menu>
      )}
    </header>
  );
}
