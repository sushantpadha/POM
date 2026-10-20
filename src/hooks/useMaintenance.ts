import { useMemo } from 'react';
import { useStore } from '../store/store';
import { detectTensions } from '../logic/tensions';
import { suggestRetakes } from '../logic/retakes';

/** Potential tensions + suggested retakes, recomputed from current file versions. */
export function useMaintenance() {
  const responses = useStore((s) => s.responses);
  const files = useStore((s) => s.files);
  const progress = useStore((s) => s.progress);
  const dismissed = useStore((s) => s.dismissedTensions);
  const deferred = useStore((s) => s.deferred);

  return useMemo(() => {
    const tensions = detectTensions(responses, files);
    const openTensions = tensions.filter((t) => !dismissed.includes(t.rule.id));
    const all = suggestRetakes(responses, progress, files, openTensions);
    const now = Date.now();
    const isDeferred = (id: string) => !!deferred[id] && new Date(deferred[id]).getTime() > now;
    return {
      tensions,
      openTensions,
      retakes: all.filter((r) => !isDeferred(r.nodeId)),
      deferredRetakes: all.filter((r) => isDeferred(r.nodeId)),
    };
  }, [responses, files, progress, dismissed, deferred]);
}
