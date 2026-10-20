import { useState } from 'react';
import { Eraser, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL, nodesForFile, questionsForFile } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { activeTags, availableIds } from '../../logic/graph';
import { plural } from '../../logic/format';

/** Side-by-side explanation so the two actions are never confused. */
function ResetVsErase({ highlight }: { highlight: 'reset' | 'erase' }) {
  return (
    <div className="compare-grid">
      <div style={highlight === 'reset' ? { borderColor: 'var(--accent)' } : { opacity: 0.6 }}>
        <h4><RotateCcw size={13} /> Reset topic</h4>
        <ul>
          <li>Clears generated (pencil) and AI (robot) lines</li>
          <li>Keeps your own and locked lines</li>
          <li>Keeps answers if you choose, and regenerates notes from them</li>
          <li>Old version stays in history</li>
        </ul>
      </div>
      <div style={highlight === 'erase' ? { borderColor: 'var(--danger)' } : { opacity: 0.6 }}>
        <h4><Eraser size={13} /> Erase topic data</h4>
        <ul>
          <li>Removes every line, including yours and locked ones</li>
          <li>Removes the linked questionnaire answers</li>
          <li>Removes the file’s version history</li>
          <li>Rebuilding requires retaking the questions</li>
        </ul>
      </div>
    </div>
  );
}

/** Nodes that would become undiscovered again if these answers were removed. */
function relockedBy(qids: string[]): string[] {
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
  const [retain, setRetain] = useState(true);
  const entries = file.current.entries;
  const derived = entries.filter((e) => !e.locked && e.provenance !== 'human').length;
  const kept = entries.length - derived;
  const qids = questionsForFile(fileId).map((q) => q.id).filter((id) => responses[id]);
  const relocked = retain ? [] : relockedBy(qids);

  return (
    <div className="scrim" onClick={() => setDialog(null)}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="reset-title" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h2 id="reset-title"><RotateCcw size={16} /> Reset topic: <span className="mono" style={{ fontSize: 14 }}>{fileId}</span></h2>
        </div>
        <div className="dialog-body">
          <ResetVsErase highlight="reset" />
          <p>
            {plural(derived, 'derived line')} will be cleared; {plural(kept, 'human-written or locked line')} will be kept.
          </p>
          <label className="check" style={{ margin: 0 }}>
            <input type="checkbox" checked={retain} onChange={(e) => setRetain(e.target.checked)} />
            <span>
              <b>Retain my underlying answers ({qids.length})</b> and regenerate notes from them. Untick to also clear these
              answers{qids.length ? ` (${qids.join(', ')})` : ''}.
            </span>
          </label>
          {relocked.length > 0 && (
            <div className="callout warn">
              <span>
                Without these answers, {relocked.map((id) => NODE_BY_ID[id].name).join(', ')} will become undiscovered again.
              </span>
            </div>
          )}
        </div>
        <div className="dialog-foot">
          <button className="btn" onClick={() => setDialog(null)}>Cancel</button>
          <button className="btn primary" onClick={() => resetTopic(fileId, retain)}>
            Reset topic
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
  const [confirm, setConfirm] = useState('');
  const qids = questionsForFile(fileId).map((q) => q.id).filter((id) => responses[id]);
  const relocked = relockedBy(qids);
  const nodes = nodesForFile(fileId).map((id) => NODE_BY_ID[id].name);
  const name = fileId.split('/')[1];
  const humanLines = file.current.entries.filter((e) => e.provenance === 'human').length;
  const lockedLines = file.current.entries.filter((e) => e.locked).length;

  return (
    <div className="scrim" onClick={() => setDialog(null)}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="erase-title" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-head">
          <h2 id="erase-title" style={{ color: 'var(--danger)' }}>
            <Eraser size={16} /> Erase topic data: <span className="mono" style={{ fontSize: 14 }}>{fileId}</span>
          </h2>
        </div>
        <div className="dialog-body">
          <ResetVsErase highlight="erase" />
          <div className="callout danger">
            <div>
              This will permanently remove, from this browser:
              <ul style={{ marginTop: 6 }}>
                <li>
                  {plural(file.current.entries.length, 'line')} in the current version
                  {humanLines + lockedLines > 0 && ` (including ${plural(humanLines, 'human-written line')} and ${plural(lockedLines, 'locked line')})`}
                </li>
                <li>{plural(file.history.length, 'earlier version')}{file.proposal ? ' and a pending proposal' : ''}</li>
                <li>
                  {plural(qids.length, 'answer')} from {nodes.join(' and ')}
                </li>
                {relocked.length > 0 && <li>Discovery of {relocked.map((id) => NODE_BY_ID[id].name).join(', ')}, which depended on those answers</li>}
              </ul>
            </div>
          </div>
          <p>
            Reconstructing this topic will require retaking its questions. Notes in other files that you wrote yourself are
            not touched. (Prototype: this is a simulated deletion of local demo data.)
          </p>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span>
              Type <b className="mono" style={{ color: 'var(--text)' }}>{name}</b> to confirm
            </span>
            <input className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoFocus aria-label="Confirm file name" />
          </label>
        </div>
        <div className="dialog-foot">
          <button className="btn" onClick={() => setDialog(null)}>Cancel</button>
          <button className="btn danger solid" disabled={confirm.trim() !== name} onClick={() => eraseTopic(fileId)}>
            Erase topic data
          </button>
        </div>
      </div>
    </div>
  );
}
