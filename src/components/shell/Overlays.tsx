import { useEffect } from 'react';
import { Database, Network, Sprout, UserRound, X } from 'lucide-react';
import { useStore, type Toast } from '../../store/store';
import { fmtDateTime } from '../../logic/format';

export function DemoChooser() {
  const chooseProfile = useStore((s) => s.chooseProfile);
  return (
    <div className="scrim">
      <div className="dialog chooser" role="dialog" aria-modal="true" aria-labelledby="chooser-title">
        <div className="dialog-head">
          <h2 id="chooser-title">
            <Network size={16} /> Personal Operating Model — prototype
          </h2>
        </div>
        <div className="dialog-body">
          <p>
            A research-informed self-assessment prototype. All AI behaviour is simulated with predefined outputs, and all data
            stays in this browser. Choose how to explore it — you can switch later from the profile menu.
          </p>
          <div className="chooser-grid">
            <button className="chooser-card" onClick={() => chooseProfile('fresh')}>
              <Sprout size={18} style={{ color: 'var(--human)' }} />
              <h3>Start fresh</h3>
              <p>Begin at “Who am I?”: onboarding and consent, then answer questions and watch the map and notes grow.</p>
            </button>
            <button className="chooser-card" onClick={() => chooseProfile('sample')}>
              <UserRound size={18} style={{ color: 'var(--accent)' }} />
              <h3>Explore a sample profile</h3>
              <p>
                Priya, an MSc student seven months in, weighing a PhD offer abroad against family commitments. Includes
                history, tensions and retake suggestions.
              </p>
            </button>
          </div>
        </div>
        <div className="dialog-foot" />
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
            <Database size={16} /> Data, storage & consent
          </h2>
        </div>
        <div className="dialog-body">
          <ul>
            <li>
              <b>Stored:</b> questionnaire answers (with confidence and dates), notes, line metadata and up to five earlier
              versions per notes file.
            </li>
            <li>
              <b>Where:</b> this browser’s <span className="mono">localStorage</span> only. No server, no account, no
              encryption. This is a prototype; it does not provide secure storage.
            </li>
            <li>
              <b>AI:</b> summaries, potential tensions and “Ask the model” answers are simulated from predefined outputs and
              simple rules. Real AI interpretations could be wrong — they are always labelled.
            </li>
            <li>
              <b>Not clinical:</b> nothing here is a diagnosis or a validated psychological measurement.
            </li>
            <li>
              <b>Consent:</b>{' '}
              {onboardedAt ? `preliminary consent given ${fmtDateTime(onboardedAt)}.` : 'not yet given — start at “Who am I?”.'}{' '}
              It covers local storage and note generation only.
            </li>
            <li>
              <b>Control:</b> use a file’s menu to reset a topic or erase its notes, answers and history.
            </li>
          </ul>
        </div>
        <div className="dialog-foot">
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
