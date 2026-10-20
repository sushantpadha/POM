import { useState } from 'react';
import { ArrowRight, Check, Eye, MessageSquarePlus, RotateCw, Undo2, X } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { useMaintenance } from '../../hooks/useMaintenance';
import { nodesWithQuestionTags } from '../../logic/graph';
import type { Evidence, Tension } from '../../logic/tensions';
import { ProvenanceIcon } from '../branding';
import { RichText } from '../notes/RichText';
import { FloatShell } from './FloatingControls';

function EvidenceItem({ ev }: { ev: Evidence }) {
  const openFile = useStore((s) => s.openFile);
  return (
    <div className="evidence-item" onClick={() => openFile(ev.fileId, { entryId: ev.entry.id })} title="Inspect source note">
      <ProvenanceIcon p={ev.entry.provenance} size={12} />
      <div>
        <RichText text={ev.entry.text} />
        <div className="src">
          {ev.fileId} · {ev.qid}
          <Eye size={11} />
        </div>
      </div>
    </div>
  );
}

function TensionCard({ t, focus }: { t: Tension; focus: boolean }) {
  const dismissed = useStore((s) => s.dismissedTensions.includes(t.rule.id));
  const context = useStore((s) => s.tensionContext[t.rule.id]);
  const files = useStore((s) => s.files);
  const dismiss = useStore((s) => s.dismissTension);
  const restore = useStore((s) => s.restoreTension);
  const addContext = useStore((s) => s.addTensionContext);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const openFile = useStore((s) => s.openFile);
  const { available } = useDerived();
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState('');
  const [target, setTarget] = useState(t.fileIds[0]);

  const retakeNodes = nodesWithQuestionTags(MODEL, t.rule.tags).filter((id) => available.has(id));
  const contextEntry = context ? files[context.fileId]?.current.entries.find((e) => e.id === context.entryId) : undefined;

  // Show each side once per file to keep the card compact.
  const dedupe = (evs: Evidence[]) => evs.filter((e, i) => evs.findIndex((x) => x.fileId === e.fileId && x.qid === e.qid) === i).slice(0, 2);

  return (
    <div className={`card ${focus ? 'focus' : ''} ${dismissed ? 'dismissed' : ''}`} data-tension={t.rule.id}>
      <div className="row" style={{ marginBottom: 6 }}>
        <span className="chip" style={{ color: 'var(--chg)' }}>Potential tension</span>
        <span className="faint" style={{ fontSize: 11.5 }}>{t.fileIds.join(' ↔ ')}</span>
      </div>
      <h4>{t.rule.title}</h4>
      <p>{t.rule.summary}</p>
      {!dismissed && (
        <>
          <div className="evidence">
            {dedupe(t.a).map((ev) => <EvidenceItem key={ev.entry.id} ev={ev} />)}
            <div className="vs">and</div>
            {dedupe(t.b).map((ev) => <EvidenceItem key={ev.entry.id} ev={ev} />)}
          </div>

          <div style={{ marginTop: 10 }}>
            <div className="faint" style={{ fontSize: 11.5, marginBottom: 5 }}>
              Related tags {t.rule.tags.map((tg) => <span key={tg} className="mono">#{tg} </span>)}— revisit:
            </div>
            <div className="row wrap" style={{ gap: 5 }}>
              {retakeNodes.map((id) => (
                <button key={id} className="chip link" onClick={() => openQuestionnaire(id)}>
                  <RotateCw size={10} /> {NODE_BY_ID[id].name}
                </button>
              ))}
            </div>
          </div>

          {contextEntry && (
            <div className="callout" style={{ marginTop: 10, cursor: 'pointer' }} onClick={() => openFile(context!.fileId, { entryId: contextEntry.id })}>
              <Check size={14} style={{ color: 'var(--human)' }} />
              <span>
                <b>Your context</b> ({context!.fileId}): {contextEntry.text}
              </span>
            </div>
          )}

          {writing ? (
            <div style={{ marginTop: 10 }}>
              <textarea className="input" rows={3} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. why both can be true for you, or what has changed since." />
              <div className="row" style={{ marginTop: 6 }}>
                <span className="faint" style={{ fontSize: 11.5 }}>Add to</span>
                <select className="input" style={{ width: 'auto', padding: '3px 6px', fontSize: 12 }} value={target} onChange={(e) => setTarget(e.target.value)}>
                  {t.fileIds.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
                <span className="grow" />
                <button className="btn sm ghost" onClick={() => setWriting(false)}>Cancel</button>
                <button
                  className="btn sm primary"
                  disabled={!text.trim()}
                  onClick={() => {
                    addContext(t.rule.id, target, text.trim());
                    setWriting(false);
                    setText('');
                  }}
                >
                  Save as my note
                </button>
              </div>
            </div>
          ) : (
            <div className="card-actions">
              <button className="btn sm" onClick={() => openFile(t.a[0].fileId, { entryId: t.a[0].entry.id })}>
                <Eye size={12} /> Inspect notes
              </button>
              <button className="btn sm" onClick={() => setWriting(true)}>
                <MessageSquarePlus size={12} /> {contextEntry ? 'Add more context' : 'Add context'}
              </button>
              <button className="btn sm ghost" onClick={() => dismiss(t.rule.id)}>
                <X size={12} /> Dismiss
              </button>
            </div>
          )}
        </>
      )}
      {dismissed && (
        <div className="card-actions">
          <button className="btn sm ghost" onClick={() => restore(t.rule.id)}>
            <Undo2 size={12} /> Restore
          </button>
        </div>
      )}
    </div>
  );
}

export function TensionsPanel() {
  const { tensions, openTensions } = useMaintenance();
  const focusNode = useStore((s) => s.tensionFocus);
  const setFloating = useStore((s) => s.setFloating);
  const [showDismissed, setShowDismissed] = useState(false);
  const dismissedCount = tensions.length - openTensions.length;

  const node = focusNode ? NODE_BY_ID[focusNode] : null;
  const nodeTags = node ? new Set(MODEL.questionsByNode[node.id].flatMap((q) => q.selfTags)) : null;
  const relevant = (t: Tension) =>
    !node || (node.fileId && t.fileIds.includes(node.fileId)) || t.rule.tags.some((tg) => nodeTags!.has(tg));
  const list = (showDismissed ? tensions : openTensions).filter(relevant);

  return (
    <FloatShell
      icon="!"
      title="Potential tensions"
      sub="Across the current versions of related files"
      foot={
        <div className="disclaimer">
          <span>
            Flagged by simple rules over your current notes (simulated AI). A potential tension is a prompt to reflect, not
            a proven contradiction — many apparent tensions have good explanations.
          </span>
        </div>
      }
    >
      {node && (
        <div className="row">
          <span className="chip">Related to {node.name}</span>
          <button className="btn sm ghost" onClick={() => setFloating('tensions', null)}>
            Show all <ArrowRight size={12} />
          </button>
        </div>
      )}
      {list.length === 0 && (
        <div className="empty" style={{ padding: 20 }}>
          <h3>No potential tensions{node ? ' for this node' : ''}</h3>
          <p>Tensions are checked whenever your notes change.</p>
        </div>
      )}
      {list.map((t) => (
        <TensionCard key={t.rule.id} t={t} focus={!!node} />
      ))}
      {dismissedCount > 0 && (
        <button className="btn ghost sm" style={{ alignSelf: 'flex-start' }} onClick={() => setShowDismissed(!showDismissed)}>
          {showDismissed ? 'Hide' : 'Show'} {dismissedCount} dismissed
        </button>
      )}
    </FloatShell>
  );
}
