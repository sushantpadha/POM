import { useState, useSyncExternalStore } from 'react';
import { Download, FlaskConical } from 'lucide-react';
import { useStore } from '../../store/store';
import { QUESTION_SET_VERSION } from '../../data/questions';
import { disable, enable, EVENT_CAP, exportText, readLog, subscribe } from '../../logic/experiment';
import { version as APP_VERSION } from '../../../package.json';

export const EXPERIMENT_LINE =
  'Records every answer, note and click with timestamps in this browser, so you can export it and share it with the research team. Nothing is sent automatically.';

/** Logs a session start with the app, question-set and AI settings (never the display name). */
export function startExperimentSession() {
  const s = useStore.getState();
  s.track('session_start', {
    appVersion: APP_VERSION,
    questionSetVersion: QUESTION_SET_VERSION,
    ai: s.ai.mode === 'ollama' && !!s.ai.consentAt,
    model: s.ai.mode === 'ollama' && s.ai.consentAt ? s.ai.model : null,
  });
}

function downloadLog() {
  const text = exportText();
  const log = readLog();
  if (!text || !log) return;
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `pom-experiment-${log.participantId}-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "Advanced options" → Experiment mode (PLAN_V2 section 6). Off by default. */
export function ExperimentSettings() {
  const log = useSyncExternalStore(subscribe, readLog);
  const profile = useStore((s) => s.profile);
  const [turningOff, setTurningOff] = useState(false);
  const on = !!log?.enabled;

  return (
    <details className="advanced" open={on || !!log || undefined}>
      <summary>Advanced options</summary>
      <label className="check" style={{ marginTop: 10 }}>
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            if (e.target.checked) {
              setTurningOff(false);
              enable();
              startExperimentSession();
            } else setTurningOff(true);
          }}
          aria-label="Experiment mode"
        />
        <span>
          <b>Experiment mode</b>
          <br />
          {EXPERIMENT_LINE}
        </span>
      </label>
      {turningOff && on && (
        <div className="callout warn" data-experiment-off>
          <span>
            Stop logging now. What should happen to the {log!.events.length} events recorded so far?
            <span className="row" style={{ marginTop: 8 }}>
              <button className="btn sm" onClick={() => { useStore.getState().track('session_end', { reason: 'mode turned off' }); disable(true); setTurningOff(false); }}>
                Keep it for export
              </button>
              <button className="btn sm danger" onClick={() => { disable(false); setTurningOff(false); }}>
                Delete the log
              </button>
            </span>
          </span>
        </div>
      )}
      {log && (
        <div className="experiment-status" data-experiment-status>
          <span>
            Participant <span className="mono">{log.participantId}</span> · {log.events.length} event{log.events.length === 1 ? '' : 's'}
            {on ? '' : ' · logging is off'}
          </span>
          {log.cappedAt && (
            <span className="new-tag">The log reached {EVENT_CAP} events and stopped recording. Export it, then delete it to start again.</span>
          )}
          {on && profile === 'sample' && <span className="faint">Nothing is recorded while the sample profile is loaded.</span>}
          <span className="row">
            <button className="btn sm" onClick={downloadLog}>
              <Download size={12} /> Export experiment log
            </button>
            {!on && (
              <button className="btn sm danger" onClick={() => disable(false)}>
                Delete the log
              </button>
            )}
          </span>
        </div>
      )}
      <p className="faint" style={{ margin: '8px 0 0', display: 'flex', gap: 6 }}>
        <FlaskConical size={13} style={{ flex: 'none', marginTop: 3 }} />
        The experiment log is separate from your data export, which is unchanged.
      </p>
    </details>
  );
}
