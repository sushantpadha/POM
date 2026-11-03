import { useStore } from '../../store/store';
import { NODE_BY_ID } from '../../data/nodes';

/** Shown before the 10th, 20th… new topic. No celebration, no streak: just a chance to stop. */
export function Pause({ nodeId, count }: { nodeId: string; count: number }) {
  const ack = useStore((s) => s.ackMilestone);
  const openReflection = useStore((s) => s.openReflection);
  const go = useStore((s) => s.go);
  return (
    <div className="page">
      <h1 className="page-title">A moment before you go on</h1>
      <p className="page-sub">
        You have reflected on {count} topics. There is no hurry: your notes will be here whenever you come back.
      </p>
      <div className="reflect-actions">
        <button
          className="btn primary"
          onClick={() => {
            ack(count + 1);
            openReflection(nodeId);
          }}
        >
          Continue to {NODE_BY_ID[nodeId].name}
        </button>
        <button className="btn" onClick={() => go({ name: 'journal' })}>
          Take a break
        </button>
      </div>
    </div>
  );
}
