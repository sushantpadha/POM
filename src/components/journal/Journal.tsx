import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { DIRS, FILE_DEFS } from '../../data/files';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { useMaintenance } from '../../hooks/useMaintenance';
import { fmtDate } from '../../logic/format';
import { BRANCH_COLOR, BRANCH_LABEL } from '../branding';

/** One quiet suggestion at a time. */
function useNextStep(): { text: string; action: string; run: () => void } | null {
  const files = useStore((s) => s.files);
  const progress = useStore((s) => s.progress);
  const openFile = useStore((s) => s.openFile);
  const openReflection = useStore((s) => s.openReflection);
  const { status } = useDerived();
  const { retakes } = useMaintenance();

  const draft = FILE_DEFS.find((f) => files[f.id].proposal);
  if (draft) return { text: `A draft for ${files[draft.id].title} is waiting for you to read.`, action: 'Read draft', run: () => openFile(draft.id) };

  const retake = retakes.find((r) => r.reasons.some((x) => x.kind === 'user-reported')) ?? retakes.find((r) => r.reasons.some((x) => x.kind === 'flexible-age'));
  if (retake) {
    const name = NODE_BY_ID[retake.nodeId].name;
    const userSaid = retake.reasons.some((x) => x.kind === 'user-reported');
    return {
      text: userSaid ? `You noted that something changed in ${name}.` : `Your answers in ${name} are a while old. Views like these often change.`,
      action: 'Revisit this topic',
      run: () => openReflection(retake.nodeId),
    };
  }

  const fresh = MODEL.order.find((id) => id !== 'root' && status[id] === 'available' && !progress[id]);
  if (fresh) {
    const n = NODE_BY_ID[fresh];
    const first = ['ethics', 'worldview', 'goals'].every((b) => status[b] === 'available');
    return {
      text: first ? 'Start wherever you like. Each area has a few short questions, and you can skip any of them.' : `${n.name} is new.`,
      action: first ? `Start with ${n.name}` : 'Start reflecting',
      run: () => openReflection(fresh),
    };
  }
  return null;
}

export function Journal() {
  const files = useStore((s) => s.files);
  const progress = useStore((s) => s.progress);
  const userName = useStore((s) => s.userName);
  const openFile = useStore((s) => s.openFile);
  const openReflection = useStore((s) => s.openReflection);
  const next = useNextStep();

  return (
    <div className="page">
      <h1 className="page-title" style={{ marginBottom: 28 }}>{userName ? `${userName}’s journal` : 'Your journal'}</h1>

      {next && (
        <div className="next-step">
          <p>{next.text}</p>
          <button className="btn small" onClick={next.run}>
            {next.action}
          </button>
        </div>
      )}

      {DIRS.map((d) => {
        const hasNotes = (id: string) => files[id].current.entries.length > 0 || !!files[id].proposal;
        const topicNotes = FILE_DEFS.filter((f) => f.dir === d.id && f.name !== 'main' && hasNotes(f.id));
        // The overview is listed once the area has other notes, so it can be written or summarised.
        const notes = FILE_DEFS.filter((f) => f.dir === d.id && (f.name === 'main' ? hasNotes(f.id) || topicNotes.length > 0 : hasNotes(f.id)));
        const branch = NODE_BY_ID[d.branch];
        const p = progress[d.branch];
        return (
          <section key={d.id} className="area">
            <div className="area-head">
              <h2>
                <span className="dot" style={{ background: BRANCH_COLOR[d.branch] }} />
                {BRANCH_LABEL[d.branch]}
              </h2>
              <button className="link small" onClick={() => openReflection(branch.id)}>
                {p?.completedAt ? 'Revisit' : p ? 'Continue' : 'Start reflecting'}
              </button>
            </div>
            {notes.length === 0 && <p className="empty-line">No notes yet.</p>}
            {notes.map((f) => (
              <button key={f.id} className="note-link" onClick={() => openFile(f.id)}>
                <span className="t">{f.name === 'main' ? 'Overview' : files[f.id].title}</span>
                <span className="faint small">
                  {files[f.id].proposal ? 'draft waiting' : files[f.id].current.entries.length ? fmtDate(files[f.id].current.createdAt) : 'empty'}
                </span>
              </button>
            ))}
          </section>
        );
      })}
    </div>
  );
}
