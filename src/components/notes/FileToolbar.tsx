import { useStore } from '../../store/store';
import type { FileMode } from '../../types';

const MODES: { id: FileMode; label: string }[] = [{ id: 'notes', label: 'Notes' }];

export function FileToolbar({ fileId }: { fileId: string }) {
  const mode = useStore((s) => s.fileModes[fileId] ?? 'notes');
  const setFileMode = useStore((s) => s.setFileMode);
  return (
    <div className="file-toolbar">
      <div className="seg">
        {MODES.map((m) => (
          <button key={m.id} className={mode === m.id ? 'sel' : ''} onClick={() => setFileMode(fileId, m.id)}>
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
