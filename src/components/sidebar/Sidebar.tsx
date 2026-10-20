import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChevronRight,
  FileText,
  FolderClosed,
  FolderOpen,
  HardDrive,
  MoreHorizontal,
  Network,
} from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL, nodesForFile } from '../../store/model';
import { DIRS, FILE_DEFS } from '../../data/files';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { BRANCH_COLOR, STATUS_LABEL } from '../branding';
import { fileMenuItems } from './fileMenu';

export function Sidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>({ root: true, ethics: true, worldview: true, 'long-term-goals': true });
  const [menu, setMenu] = useState<{ fileId: string; x: number; y: number } | null>(null);
  const tabs = useStore((s) => s.tabs);
  const activeTab = useStore((s) => s.activeTab);
  const files = useStore((s) => s.files);
  const openFile = useStore((s) => s.openFile);
  const setDialog = useStore((s) => s.setDialog);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const { status, available, isNew } = useDerived();
  const active = tabs[activeTab];
  const activeFile = active?.kind === 'file' ? active.fileId : null;

  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const quests = MODEL.order.filter((id) => id !== 'root' && available.has(id));

  return (
    <aside className="sidebar" aria-label="File explorer">
      <div className="sidebar-head">
        <span className="section-label" style={{ margin: 0 }}>Knowledge base</span>
      </div>
      <div className="sidebar-scroll">
        <div className="tree-row" onClick={() => toggle('root')}>
          <ChevronRight size={13} className={`chev ${open.root ? 'open' : ''}`} />
          <HardDrive size={13} style={{ color: 'var(--text-faint)' }} />
          <span className="name">personal-model/</span>
        </div>
        {open.root && (
          <div className="tree-children">
            {DIRS.map((d) => (
              <div key={d.id}>
                <div className="tree-row" onClick={() => toggle(d.id)}>
                  <ChevronRight size={13} className={`chev ${open[d.id] ? 'open' : ''}`} />
                  {open[d.id] ? (
                    <FolderOpen size={13} style={{ color: BRANCH_COLOR[d.branch] }} />
                  ) : (
                    <FolderClosed size={13} style={{ color: BRANCH_COLOR[d.branch] }} />
                  )}
                  <span className="name">{d.id}/</span>
                </div>
                {open[d.id] && (
                  <div className="tree-children">
                    {FILE_DEFS.filter((f) => f.dir === d.id).map((f) => {
                      const file = files[f.id];
                      const isMenuOpen = menu?.fileId === f.id;
                      return (
                        <div
                          key={f.id}
                          className={`tree-row ${activeFile === f.id ? 'active' : ''} ${isMenuOpen ? 'menu-open' : ''}`}
                          onClick={() => openFile(f.id)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setMenu({ fileId: f.id, x: e.clientX, y: e.clientY });
                          }}
                          title={f.title}
                          data-file={f.id}
                        >
                          <FileText size={13} style={{ color: 'var(--text-faint)', marginLeft: 13 }} />
                          <span className="name" style={{ fontWeight: f.name === 'main' ? 500 : 400 }}>{f.name}</span>
                          {file.proposal && <span className="badge-dot" title="Proposed update waiting for review" />}
                          {!isMenuOpen && file.current.entries.length === 0 && <span className="tree-meta">empty</span>}
                          <span className="row-actions">
                            <button
                              className="icon-btn"
                              style={{ width: 20, height: 20 }}
                              aria-label={`Actions for ${f.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                setMenu({ fileId: f.id, x: r.left, y: r.bottom + 4 });
                              }}
                            >
                              <MoreHorizontal size={13} />
                            </button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 14 }} />
        <div className="sidebar-head" style={{ padding: '6px 8px' }}>
          <span className="section-label" style={{ margin: 0 }}>Questionnaires</span>
          <span className="tree-meta">{quests.length} discovered</span>
        </div>
        {quests.length === 0 && (
          <div className="faint" style={{ fontSize: 12, padding: '2px 8px' }}>Complete onboarding to reveal the first three.</div>
        )}
        {quests.map((id) => (
          <div key={id} className="quest-row" onClick={() => openQuestionnaire(id)} title="Open questionnaire">
            <span
              className={`status-dot ${status[id]}`}
              style={{ color: BRANCH_COLOR[NODE_BY_ID[id].branch], flex: 'none' }}
              title={STATUS_LABEL[status[id]]}
            />
            <span className="name">{NODE_BY_ID[id].name}</span>
            {isNew(id) && <span className="badge-dot" title="Newly unlocked" />}
          </div>
        ))}
      </div>
      <div className="sidebar-foot">
        <HardDrive size={13} style={{ flex: 'none', marginTop: 2 }} />
        <span>
          Stored only in this browser (local storage) — not on a secure server.{' '}
          <button onClick={() => setDialog({ kind: 'about' })}>Data & consent</button>
        </span>
      </div>
      {menu && (
        <Menu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          {fileMenuItems(menu.fileId, nodesForFile(menu.fileId)).map((item, i) =>
            item === 'sep' ? (
              <div key={i} className="menu-sep" />
            ) : (
              <button
                key={item.label}
                className={`menu-item ${item.danger ? 'danger' : ''}`}
                onClick={() => {
                  setMenu(null);
                  item.run();
                }}
              >
                <item.Icon size={14} />
                {item.label}
              </button>
            ),
          )}
          <div className="menu-sep" />
          <div className="menu-note">
            <Network size={11} style={{ verticalAlign: -1 }} /> Fed by{' '}
            {nodesForFile(menu.fileId).map((id) => NODE_BY_ID[id].name).join(', ')}
          </div>
        </Menu>
      )}
    </aside>
  );
}

export function Menu({ x, y, onClose, children }: { x: number; y: number; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
  const top = Math.min(y, window.innerHeight - 320);
  return (
    <div ref={ref} className="menu" style={{ left: x, top }} role="menu">
      {children}
    </div>
  );
}
