import { useState } from 'react';
import { ArrowRight, Check, Eye } from 'lucide-react';
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
      <h4>{t.rule.title}</h4>
      <p>{t.rule.summary}</p>
      {!dismissed && (
        <>
          <div className="evidence">
            {dedupe(t.a).map((ev) => <EvidenceItem key={ev.entry.id} ev={ev} />)}
            <div className="vs">and</div>
            {dedupe(t.b).map((ev) => <EvidenceItem key={ev.entry.id} ev={ev} />)}
          </div>

          {retakeNodes.length > 0 && (
            <div className="revisit">
              <span className="faint">Revisit:</span>
              {retakeNodes.map((id, i) => (
                <span key={id}>
                  {i > 0 && <span className="faint">, </span>}
                  <a onClick={() => openQuestionnaire(id)} title={`Questions tagged ${t.rule.tags.map((tg) => `#${tg}`).join(' ')}`}>
                    {NODE_BY_ID[id].name}
                  </a>
                </span>
              ))}
            </div>
          )}

          {contextEntry && (
            <div className="callout" style={{ marginTop: 10, cursor: 'pointer' }} onClick={() => openFile(context!.fileId, { entryId: contextEntry.id })}>
              <Check size={14} style={{ color: 'var(--human)' }} />
              <span>
                <b>Your note:</b> {contextEntry.text}
              </span>
            </div>
          )}

          {writing ? (
            <div style={{ marginTop: 10 }}>
              <textarea className="input" rows={3} autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Why both can be true, or what has changed" />
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
                  Save note
                </button>
              </div>
            </div>
          ) : (
            <div className="card-actions">
              <button className="btn sm" onClick={() => openFile(t.a[0].fileId, { entryId: t.a[0].entry.id })}>
                Open notes
              </button>
              <button className="btn sm" onClick={() => setWriting(true)}>
                {contextEntry ? 'Add more context' : 'Add context'}
              </button>
              <button className="btn sm ghost" onClick={() => dismiss(t.rule.id)}>
                Dismiss
              </button>
            </div>
          )}
        </>
      )}
      {dismissed && (
        <div className="card-actions">
          <button className="btn sm ghost" onClick={() => restore(t.rule.id)}>
            Restore
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
  const nodeFiles = node ? new Set(MODEL.questionsByNode[node.id].flatMap((q) => q.fileIds)) : null;
  const relevant = (t: Tension) =>
    !node || t.fileIds.some((f) => nodeFiles!.has(f)) || t.rule.tags.some((tg) => nodeTags!.has(tg));
  const list = (showDismissed ? tensions : openTensions).filter(relevant);

  return (
    <FloatShell
      icon="!"
      title="Potential tensions"
      sub="Found by fixed rules that compare your current notes across files. Not a judgement — often both can be true."

    >
      {node && (
        <div className="row">
          <span className="muted">Related to {node.name}</span>
          <button className="btn sm ghost" onClick={() => setFloating('tensions', null)}>
            Show all <ArrowRight size={12} />
          </button>
        </div>
      )}
      {list.length === 0 && (
        <p className="muted" style={{ margin: 0 }}>Nothing found{node ? ' for this area' : ''}.</p>
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
