import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useStore } from '../../store/store';
import { nodesForFile } from '../../store/model';
import type { FileMode } from '../../types';
import { fileMenuItems, requestSummary } from '../sidebar/fileMenu';
import { Menu } from '../sidebar/Sidebar';

export function FileToolbar({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const mode = useStore((s) => s.fileModes[fileId] ?? 'notes');
  const setFileMode = useStore((s) => s.setFileMode);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const modes: { id: FileMode; label: string }[] = [
    { id: 'notes', label: file.proposal ? 'Notes · draft to review' : 'Notes' },
    { id: 'history', label: `History (${file.history.length})` },
    { id: 'changes', label: 'Changes over time' },
  ];

  return (
    <div className="file-toolbar">
      <div className="seg" role="tablist">
        {modes.map((m) => (
          <button key={m.id} role="tab" aria-selected={mode === m.id} className={mode === m.id ? 'sel' : ''} onClick={() => setFileMode(fileId, m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <span className="grow" />
      <button
        className="btn"
        onClick={() => requestSummary(fileId)}
        disabled={!!file.proposal}
        title={file.proposal ? 'Commit or cancel the current draft first' : 'Draft a shorter version. Your own and locked lines are kept.'}
      >
        Summarise
      </button>
      <button
        className="icon-btn"
        aria-label="More file actions"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setMenu({ x: r.right - 220, y: r.bottom + 4 });
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {menu && (
        <Menu x={menu.x} y={menu.y} onClose={() => setMenu(null)}>
          {fileMenuItems(fileId, nodesForFile(fileId))
            .filter((i) => i === 'sep' || i.label !== 'Open')
            .map((item, i) =>
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
                  <item.Icon size={14} /> {item.label}
                </button>
              ),
            )}
        </Menu>
      )}
    </div>
  );
}
