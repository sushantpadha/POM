import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronRight, HardDrive, MoreHorizontal, Network } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL, nodesForFile } from '../../store/model';
import { DIRS, FILE_DEFS } from '../../data/files';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { BRANCH_COLOR } from '../branding';
import { fileMenuItems } from './fileMenu';

export function Sidebar() {
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(DIRS.map((d) => [d.id, true])));
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
        {DIRS.map((d) => (
          <div key={d.id} className="tree-dir" data-dir={d.id}>
            <div className="tree-row dir" onClick={() => toggle(d.id)}>
              <ChevronRight size={14} className={`chev ${open[d.id] ? 'open' : ''}`} />
              <span className="dir-dot" style={{ background: BRANCH_COLOR[d.branch] }} />
              <span className="name">{d.title}</span>
            </div>
            {open[d.id] && (
              <div className="tree-children">
                {FILE_DEFS.filter((f) => f.dir === d.id && visible(f.id)).map((f) => {
                  const file = files[f.id];
                  const isMenuOpen = menu?.fileId === f.id;
                  const empty = file.current.entries.length === 0;
                  return (
                    <div
                      key={f.id}
                      className={`tree-row file ${activeFile === f.id ? 'active' : ''} ${isMenuOpen ? 'menu-open' : ''} ${empty ? 'is-empty' : ''}`}
                      onClick={() => openFile(f.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setMenu({ fileId: f.id, x: e.clientX, y: e.clientY });
                      }}
                      title={empty ? `${f.id} (no notes yet)` : f.id}
                      data-file={f.id}
                    >
                      <span className="name">{f.name === 'main' ? 'Main' : f.title}</span>
                      {file.proposal && <span className="badge-dot" title="Draft to review" />}
                      <span className="row-actions">
                        <button
                          className="icon-btn"
                          style={{ width: 22, height: 22 }}
                          aria-label={`Actions for ${f.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setMenu({ fileId: f.id, x: r.left, y: r.bottom + 4 });
                          }}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {hiddenCount > 0 && (
          <div className="faint" style={{ fontSize: 12, padding: '10px 8px 0' }}>
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
