import { useState } from 'react';
import { Download, Info, RefreshCcw, Sprout, Upload, UserRound } from 'lucide-react';
import { useStore } from '../../store/store';
import { Menu } from '../sidebar/Sidebar';
import { downloadExport } from './transfer';

export function TopBar() {
  const profile = useStore((s) => s.profile);
  const userName = useStore((s) => s.userName);
  const responses = useStore((s) => s.responses);
  const chooseProfile = useStore((s) => s.chooseProfile);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setDialog = useStore((s) => s.setDialog);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const switchTo = (p: 'fresh' | 'sample') => {
    setMenu(null);
    if (window.confirm(`Replace the current demo state with ${p === 'sample' ? 'the sample profile' : 'a fresh start'}? Local demo data will be overwritten.`)) {
      chooseProfile(p);
    }
  };

  return (
    <header className="topbar">
      <div className="brand">
        <img className="brand-mark" src={`${import.meta.env.BASE_URL}pom-icon-small.svg`} alt="" width={22} height={22} />
        <span style={{ cursor: 'pointer' }} onClick={() => setActiveTab(0)}>Personal Operating Model</span>
        <small>prototype</small>
      </div>
      <div className="spacer" />
      <span className="topbar-stat">
        <b>{Object.keys(responses).length}</b> answer{Object.keys(responses).length === 1 ? '' : 's'}
      </span>
      <button className="icon-btn" title="Your data" onClick={() => setDialog({ kind: 'about' })}>
        <Info size={15} />
      </button>
      <button
        className="profile-pill"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setMenu({ x: r.right - 240, y: r.bottom + 6 });
        }}
      >
        <span className="avatar">{userName ? userName.trim().charAt(0).toUpperCase() : <UserRound size={11} />}</span>
        {userName ?? 'Not signed in'}
        {profile === 'sample' && <span className="faint">· sample profile</span>}
      </button>
      {menu && (
        <Menu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          <div className="menu-note">Demo</div>
          <button className="menu-item" onClick={() => switchTo('sample')}>
            <UserRound size={14} /> Load sample profile (Priya)
          </button>
          <button className="menu-item" onClick={() => switchTo('fresh')}>
            <Sprout size={14} /> Start fresh
          </button>
          <div className="menu-sep" />
          <div className="menu-note">Your data</div>
          <button
            className="menu-item"
            onClick={() => {
              setMenu(null);
              downloadExport();
            }}
          >
            <Download size={14} /> Export (.json)
          </button>
          <button
            className="menu-item"
            onClick={() => {
              setMenu(null);
              setDialog({ kind: 'import' });
            }}
          >
            <Upload size={14} /> Import…
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
