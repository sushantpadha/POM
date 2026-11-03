import { useState } from 'react';
import { useStore } from '../../store/store';
import { NODE_BY_ID } from '../../data/nodes';
import { FILE_DEFS } from '../../data/files';
import { useMaintenance } from '../../hooks/useMaintenance';
import { daysSince, fmtDate } from '../../logic/format';
import type { Tension } from '../../logic/tensions';
import { RichText } from '../note/RichText';

const RECENT_DAYS = 60;
const FIRST = 4;

export function Revisit() {
  const { retakes, deferredRetakes, tensions, openTensions } = useMaintenance();
  const files = useStore((s) => s.files);
  const deferred = useStore((s) => s.deferred);
  const openReflection = useStore((s) => s.openReflection);
  const openFile = useStore((s) => s.openFile);
  const defer = useStore((s) => s.deferRetake);
  const undefer = useStore((s) => s.undeferRetake);
  const restoreTension = useStore((s) => s.restoreTension);
  const [showHidden, setShowHidden] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const changed = FILE_DEFS.map((f) => files[f.id])
    .filter((f) => f.history.length > 0 && daysSince(f.current.createdAt) <= RECENT_DAYS)
    .sort((a, b) => (a.current.createdAt < b.current.createdAt ? 1 : -1))
    .slice(0, 2);
  const dismissed = tensions.filter((t) => !openTensions.includes(t));
  const nothing = !retakes.length && !openTensions.length && !changed.length;

  const retakeItem = (r: (typeof retakes)[number]) => ({
    key: `r-${r.nodeId}`,
    el: (
      <div key={`r-${r.nodeId}`} className="item" data-retake={r.nodeId}>
        <p className="what">
          {NODE_BY_ID[r.nodeId].name}: <span className="muted">{r.reasons[0].text}</span>
        </p>
        <div className="actions">
          <button className="link" onClick={() => openReflection(r.nodeId)}>
            Revisit this topic
          </button>
          {r.reasons[0].ref && (
            <button className="link" onClick={() => openFile(r.reasons[0].ref!.fileId, { entryId: r.reasons[0].ref!.entryId })}>
              Read the note
            </button>
          )}
          <button className="link quiet" onClick={() => defer(r.nodeId, 30)}>
            Not now
          </button>
        </div>
      </div>
    ),
  });
  const userSaid = retakes.filter((r) => r.reasons[0].kind === 'user-reported');
  // Most worth a look first: what you said changed, possible tensions, older answers, recent edits.
  const items = [
    ...userSaid.map(retakeItem),
    ...openTensions.map((t) => ({ key: `t-${t.rule.id}`, el: <TensionItem key={`t-${t.rule.id}`} t={t} /> })),
    ...retakes.filter((r) => !userSaid.includes(r)).map(retakeItem),
    ...changed.map((f) => ({
      key: `c-${f.id}`,
      el: (
        <div key={`c-${f.id}`} className="item">
          <p className="what">
            {f.title} <span className="muted">changed on {fmtDate(f.current.createdAt)}.</span>
          </p>
          <div className="actions">
            <button className="link" onClick={() => openFile(f.id, { mode: 'history' })}>
              See what changed
            </button>
          </div>
        </div>
      ),
    })),
  ];

  return (
    <div className="page">
      <h1 className="page-title">Revisit</h1>
      <p className="page-sub">Things that may be worth another look. Changing your mind is normal.</p>

      {nothing && <p className="muted">Nothing to revisit right now.</p>}

      {items.slice(0, showAll ? items.length : FIRST).map((it) => it.el)}
      {items.length > FIRST && !showAll && (
        <button className="link small" style={{ marginTop: 16 }} onClick={() => setShowAll(true)}>
          Show {items.length - FIRST} more
        </button>
      )}

      {(dismissed.length > 0 || deferredRetakes.length > 0) && (
        <div style={{ marginTop: 26 }}>
          <button className="link small" style={{ color: 'var(--faint)' }} onClick={() => setShowHidden(!showHidden)}>
            {showHidden ? 'Hide' : 'Show'} what you set aside ({dismissed.length + deferredRetakes.length})
          </button>
          {showHidden && (
            <div style={{ marginTop: 10 }}>
              {deferredRetakes.map((r) => (
                <p key={r.nodeId} className="small muted" style={{ padding: '4px 0' }}>
                  {NODE_BY_ID[r.nodeId].name}, until {fmtDate(deferred[r.nodeId])} ·{' '}
                  <button className="link small" onClick={() => undefer(r.nodeId)}>
                    Bring back
                  </button>
                </p>
              ))}
              {dismissed.map((t) => (
                <p key={t.rule.id} className="small muted" style={{ padding: '4px 0' }}>
                  {t.rule.title} ·{' '}
                  <button className="link small" onClick={() => restoreTension(t.rule.id)}>
                    Bring back
                  </button>
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {openTensions.length > 0 && (
        <p className="note-small" style={{ marginTop: 30 }}>
          Possible tensions come from fixed rules that compare your notes. They are not judgements; often both things are true.
        </p>
      )}
    </div>
  );
}

function TensionItem({ t }: { t: Tension }) {
  const openFile = useStore((s) => s.openFile);
  const dismiss = useStore((s) => s.dismissTension);
  const addContext = useStore((s) => s.addTensionContext);
  const context = useStore((s) => s.tensionContext[t.rule.id]);
  const files = useStore((s) => s.files);
  const [open, setOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState('');
  const sides = [t.a[0], t.b[0]];
  const contextLine = context ? files[context.fileId]?.current.entries.find((e) => e.id === context.entryId) : undefined;

  return (
    <div className="item" data-tension={t.rule.id}>
      <p className="what">
        Possible tension: <span className="muted">{t.rule.title.charAt(0).toLowerCase() + t.rule.title.slice(1)}.</span>
      </p>
      {open && (
        <>
          <p className="muted small" style={{ marginBottom: 6 }}>{t.rule.summary}</p>
          <div className="evidence">
            {sides.map((ev) => (
              <div key={ev.entry.id}>
                <RichText text={ev.entry.text} />
                <div className="from">
                  <a onClick={() => openFile(ev.fileId, { entryId: ev.entry.id })}>{files[ev.fileId].title}</a>
                </div>
              </div>
            ))}
            {contextLine && (
              <div>
                <RichText text={contextLine.text} />
                <div className="from">Your note</div>
              </div>
            )}
          </div>
          {writing && (
            <div style={{ marginBottom: 12 }}>
              <textarea className="input" rows={3} autoFocus value={text} onChange={(e) => setText(e.target.value)} aria-label="Your context" />
              <div className="row" style={{ marginTop: 8 }}>
                <button
                  className="btn small primary"
                  disabled={!text.trim()}
                  onClick={() => {
                    addContext(t.rule.id, t.a[0].fileId, text.trim());
                    setWriting(false);
                    setText('');
                  }}
                >
                  Add to {files[t.a[0].fileId].title}
                </button>
                <button className="btn small" onClick={() => setWriting(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
      <div className="actions">
        <button className="link" onClick={() => setOpen(!open)}>
          {open ? 'Close' : 'Look'}
        </button>
        {open && !writing && (
          <button className="link" onClick={() => setWriting(true)}>
            Add context
          </button>
        )}
        <button className="link quiet" onClick={() => dismiss(t.rule.id)}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
