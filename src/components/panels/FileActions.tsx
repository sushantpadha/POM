import { useStore } from '../../store/store';
import { requestSummary } from '../sidebar/fileMenu';

export function FileActions({ fileId }: { fileId: string }) {
  const setDialog = useStore((s) => s.setDialog);
  const hasProposal = useStore((s) => !!s.files[fileId].proposal);
  return (
    <section>
      <h4 className="section-label">Topic</h4>
      <div className="cp-actions">
        <button className="btn block" disabled={hasProposal} onClick={() => requestSummary(fileId)}>
          Summarise
        </button>
        <button className="btn block" onClick={() => setDialog({ kind: 'reset', fileId })}>
          Reset topic…
        </button>
        <button className="btn danger block" onClick={() => setDialog({ kind: 'erase', fileId })}>
          Erase topic data…
        </button>
      </div>
    </section>
  );
}
