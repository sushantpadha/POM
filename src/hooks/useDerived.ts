import { useMemo } from 'react';
import { useStore } from '../store/store';
import { MODEL } from '../store/model';
import { activeTags, availableIds, nodeStatus, type NodeStatus } from '../logic/graph';

/** Unlock state is a pure function of the stored responses + onboarding flag. */
export function useDerived() {
  const responses = useStore((s) => s.responses);
  const onboardedAt = useStore((s) => s.onboardedAt);
  const progress = useStore((s) => s.progress);
  const seen = useStore((s) => s.seen);

  return useMemo(() => {
    const tags = activeTags(MODEL, responses, !!onboardedAt);
    const available = availableIds(MODEL, tags);
    const status: Record<string, NodeStatus> = {};
    for (const n of MODEL.nodes) {
      status[n.id] = nodeStatus(MODEL, n.id, available, responses, progress, !!onboardedAt);
    }
    const seenSet = new Set(seen);
    /** Available but never opened. */
    const isNew = (id: string) => available.has(id) && !seenSet.has(id) && id !== 'root';
    /** Has a descendant (direct child) that was unlocked and not yet looked at. */
    const hasNewDescendants = (id: string) => MODEL.children[id].some(isNew);
    return { tags, available, status, isNew, hasNewDescendants };
  }, [responses, onboardedAt, progress, seen]);
}
