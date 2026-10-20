import { Bot, Eraser, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/store';
import { requestSummary } from '../sidebar/fileMenu';

export function FileActions({ fileId }: { fileId: string }) {
  const setDialog = useStore((s) => s.setDialog);
  const hasProposal = useStore((s) => !!s.files[fileId].proposal);
  return (
    <section>
      <h4 className="section-label">Maintenance</h4>
      <div className="cp-actions">
        <button className="btn block" disabled={hasProposal} onClick={() => requestSummary(fileId)}>
          <Bot size={13} style={{ color: 'var(--ai)' }} /> Propose AI summary
        </button>
        <button className="btn block" onClick={() => setDialog({ kind: 'reset', fileId })}>
          <RotateCcw size={13} /> Reset topic…
        </button>
        <button className="btn danger block" onClick={() => setDialog({ kind: 'erase', fileId })}>
          <Eraser size={13} /> Erase topic data…
        </button>
      </div>
      <p className="metric-note" style={{ marginTop: 8 }}>
        Reset regenerates derived notes and keeps your answers (if you choose). Erase removes notes, answers and history.
      </p>
    </section>
  );
}
