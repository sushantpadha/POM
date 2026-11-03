import { useState } from 'react';
import { useStore } from '../../store/store';
import { MODEL, questionsForFile } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { activeTags, availableIds } from '../../logic/graph';

/** Topics that would be hidden again if these answers were removed. */
function hiddenAgain(qids: string[]): string[] {
  const s = useStore.getState();
  const before = availableIds(MODEL, activeTags(MODEL, s.responses, !!s.onboardedAt));
  const without = Object.fromEntries(Object.entries(s.responses).filter(([k]) => !qids.includes(k)));
  const after = availableIds(MODEL, activeTags(MODEL, without, !!s.onboardedAt));
  return [...before].filter((id) => !after.has(id));
}

export function ResetDialog({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const responses = useStore((s) => s.responses);
  const resetTopic = useStore((s) => s.resetTopic);
  const setDialog = useStore((s) => s.setDialog);
  const [keep, setKeep] = useState(true);
  const qids = questionsForFile(fileId).map((q) => q.id).filter((id) => responses[id]);
  const hidden = keep ? [] : hiddenAgain(qids);

  return (
    <div className="scrim" onClick={() => setDialog(null)}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="reset-title">Reset {file.title}?</h2>
        <p>Lines made from your answers and AI summaries are cleared. Lines you wrote and locked lines stay. The current version stays in the history.</p>
        {qids.length > 0 && (
          <label className="toggle">
            <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} />
            <span>Keep my answers and make the notes again from them</span>
          </label>
        )}
        {hidden.length > 0 && <div className="callout">{hidden.map((id) => NODE_BY_ID[id].name).join(', ')} would be hidden again.</div>}
        <div className="foot">
          <button className="btn" onClick={() => setDialog(null)}>
            Cancel
          </button>
          <button className="btn primary" onClick={() => resetTopic(fileId, keep)}>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export function EraseDialog({ fileId }: { fileId: string }) {
  const file = useStore((s) => s.files[fileId]);
  const responses = useStore((s) => s.responses);
  const eraseTopic = useStore((s) => s.eraseTopic);
  const setDialog = useStore((s) => s.setDialog);
  const go = useStore((s) => s.go);
  const [confirm, setConfirm] = useState('');
  const qids = questionsForFile(fileId).map((q) => q.id).filter((id) => responses[id]);
  const hidden = hiddenAgain(qids);
  const word = 'erase';

  return (
    <div className="scrim" onClick={() => setDialog(null)}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="erase-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="erase-title">Erase {file.title}?</h2>
        <p>This removes, from this browser:</p>
        <ul>
          <li>every line in this note, including yours and locked ones</li>
          <li>its history</li>
          <li>{qids.length ? `the ${qids.length} answer${qids.length > 1 ? 's' : ''} it was made from` : 'no answers (none are linked)'}</li>
        </ul>
        {hidden.length > 0 && <p>{hidden.map((id) => NODE_BY_ID[id].name).join(', ')} will be hidden again.</p>}
        <p>To write it again you would answer its questions again. This can’t be undone.</p>
        <label style={{ display: 'block', marginTop: 14 }} className="small muted">
          Type “{word}” to confirm
          <input className="input" style={{ marginTop: 6 }} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoFocus aria-label="Confirm" />
        </label>
        <div className="foot">
          <button className="btn" onClick={() => setDialog(null)}>
            Cancel
          </button>
          <button
            className="btn danger solid"
            disabled={confirm.trim().toLowerCase() !== word}
            onClick={() => {
              eraseTopic(fileId);
              go({ name: 'note', fileId });
            }}
          >
            Erase
          </button>
        </div>
      </div>
    </div>
  );
}
