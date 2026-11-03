import { useEffect } from 'react';
import { Database, Download, Upload, X } from 'lucide-react';
import { downloadExport } from './transfer';
import { useStore, type Toast } from '../../store/store';
import { fmtDateTime } from '../../logic/format';

export function DemoChooser() {
  const chooseProfile = useStore((s) => s.chooseProfile);
  const setDialog = useStore((s) => s.setDialog);
  return (
    <div className="scrim">
      <div className="dialog chooser" role="dialog" aria-modal="true" aria-labelledby="chooser-title">
        <div className="dialog-head">
          <h2 id="chooser-title">
            <img src={`${import.meta.env.BASE_URL}pom-icon.svg`} alt="" width={32} height={32} style={{ borderRadius: 8 }} />
            Personal Operating Model
          </h2>
        </div>
        <div className="dialog-body">
          <p>
            A prototype for putting your ethics, worldview and long-term goals into words. It uses no AI service, and
            everything stays in this browser. You can switch later from the menu at the top right.
          </p>
          <div className="chooser-grid">
            <button className="chooser-card" onClick={() => chooseProfile('fresh')}>
              <h3>Start fresh</h3>
              <p>Begin with consent, then answer questions and build your own notes.</p>
            </button>
            <button className="chooser-card" onClick={() => chooseProfile('sample')}>
              <h3>Look at a sample</h3>
              <p>A fictional student, seven months in, weighing a PhD offer abroad against family commitments.</p>
            </button>
          </div>
        </div>
        <div className="dialog-foot" style={{ justifyContent: 'flex-start' }}>
          <button className="btn ghost" onClick={() => setDialog({ kind: 'import' })}>
            <Upload size={13} /> Import an export file…
          </button>
        </div>
      </div>
    </div>
  );
}

export function AboutDialog() {
  const setDialog = useStore((s) => s.setDialog);
  const onboardedAt = useStore((s) => s.onboardedAt);
  return (
    <div className="scrim" onClick={() => setDialog(null)}>
      <div className="dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h2>
            <Database size={16} /> Your data
          </h2>
        </div>
        <div className="dialog-body">
          <ul>
            <li>
              <b>Stored:</b> your answers (with dates and how sure you were), your notes, and up to five earlier versions of
              each notes file.
            </li>
            <li>
              <b>Where:</b> only in this browser. No server, no account, no encryption.
            </li>
            <li>
              <b>AI:</b> none is used. Summaries, tensions and “Ask your model” are pre-written or rule-based stand-ins.
            </li>
            <li>
              <b>Not clinical:</b> no diagnosis, score or validated measurement.
            </li>
            <li>
              <b>Consent:</b> {onboardedAt ? `given ${fmtDateTime(onboardedAt)}` : 'not given yet'}. It covers local storage
              and making notes only.
            </li>
            <li>
              <b>Control:</b> reset or erase any topic from its file menu. Export makes an unencrypted file — keep it
              private.
            </li>
          </ul>
        </div>
        <div className="dialog-foot">
          <button className="btn" onClick={downloadExport}>
            <Download size={13} /> Export
          </button>
          <button className="btn" onClick={() => setDialog({ kind: 'import' })}>
            <Upload size={13} /> Import…
          </button>
          <span className="grow" />
          <button className="btn" onClick={() => setDialog(null)}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useStore((s) => s.dismissToast);
  useEffect(() => {
    const id = setTimeout(() => dismiss(t.id), 4000);
    return () => clearTimeout(id);
  }, [t.id, dismiss]);
  return (
    <div className={`toast ${t.tone ?? ''}`} role="status">
      <span>{t.text}</span>
      {t.action && (
        <button
          className="btn sm"
          onClick={() => {
            t.action!.run();
            dismiss(t.id);
          }}
        >
          {t.action.label}
        </button>
      )}
      <button className="icon-btn" aria-label="Dismiss" onClick={() => dismiss(t.id)}>
        <X size={13} />
      </button>
    </div>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <ToastItem key={t.id} t={t} />
      ))}
    </div>
  );
}
