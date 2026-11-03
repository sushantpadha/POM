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
import { BRANCH_COLOR } from '../branding';
import { fileMenuItems } from './fileMenu';

export function Sidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>({ root: true, ethics: true, worldview: true, 'long-term-goals': true });
  const [menu, setMenu] = useState<{ fileId: string; x: number; y: number } | null>(null);
  const tabs = useStore((s) => s.tabs);
  const activeTab = useStore((s) => s.activeTab);
  const files = useStore((s) => s.files);
  const openFile = useStore((s) => s.openFile);
  const setDialog = useStore((s) => s.setDialog);
  const { available } = useDerived();
  const active = tabs[activeTab];
  const activeFile = active?.kind === 'file' ? active.fileId : null;

  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  // Topic files appear once a question that writes to them is open, or once they hold anything.
  const visible = (id: string) => {
    const f = files[id];
    if (f.name === 'main' || f.current.entries.length || f.history.length || f.proposal) return true;
    return MODEL.questions.some((q) => q.fileIds.includes(id) && available.has(q.nodeId));
  };
  const hiddenCount = FILE_DEFS.filter((f) => !visible(f.id)).length;

  return (
    <aside className="sidebar" aria-label="File explorer">
      <div className="sidebar-head">
        <span className="section-label" style={{ margin: 0 }}>Notes</span>
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
                    <FolderOpen size={13} style={{ color: BRANCH_COLOR[d.branch], opacity: 0.8 }} />
                  ) : (
                    <FolderClosed size={13} style={{ color: BRANCH_COLOR[d.branch], opacity: 0.8 }} />
                  )}
                  <span className="name">{d.id}/</span>
                </div>
                {open[d.id] && (
                  <div className="tree-children">
                    {FILE_DEFS.filter((f) => f.dir === d.id && visible(f.id)).map((f) => {
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
                          {file.proposal && <span className="badge-dot" title="Draft changes to review" />}
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

        {hiddenCount > 0 && (
          <div className="faint" style={{ fontSize: 11.5, padding: '10px 8px 0' }}>
            {hiddenCount} more topic file{hiddenCount > 1 ? 's' : ''} appear as you open deeper questions.
          </div>
        )}
      </div>
      <div className="sidebar-foot">
        <HardDrive size={13} style={{ flex: 'none', marginTop: 2 }} />
        <span>
          Saved in this browser only.{' '}
          <button onClick={() => setDialog({ kind: 'about' })}>Your data</button>
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
