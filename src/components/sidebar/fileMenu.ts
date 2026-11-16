import { Bot, Eraser, FileText, History, Network, RotateCcw, type LucideIcon } from 'lucide-react';
import { useStore } from '../../store/store';
import { providerFor } from '../../ai/current';
import { summarisable, summarise } from '../../ai/tasks';

export type MenuItem = { label: string; Icon: LucideIcon; run: () => void; danger?: boolean } | 'sep';

/**
 * Summarise, shared by the toolbar and the explorer menu. With AI on, the model shortens the
 * unlocked generated lines (src/ai/tasks.ts); with AI off, or if nothing survives the guards,
 * the pre-written (sample) or rule-based summary is used. Either way it is a draft to accept.
 */
export async function requestSummary(fileId: string) {
  const s = useStore.getState();
  s.openFile(fileId, { mode: 'notes' });
  const provider = providerFor(s.ai);
  let aiLines: string[] | undefined;
  if (provider && summarisable(s.files[fileId]).length >= 2) {
    s.setBusy(`Summarising with ${provider.model}…`);
    const lines = await summarise(provider, useStore.getState().files[fileId]);
    useStore.getState().setBusy(null);
    if (lines) aiLines = lines.map((l) => l.text);
    else useStore.getState().toast({ text: 'No AI reading for this one: the model did not answer or its lines did not pass the checks. Used the rule-based summary.' });
  }
  if (!useStore.getState().proposeSummary(fileId, aiLines)) {
    useStore.getState().toast({
      text: s.files[fileId].name === 'main'
        ? 'Nothing to summarise yet: the topic files in this folder are empty.'
        : 'Nothing to summarise: summaries only shorten generated lines, and this file has fewer than two.',
    });
  }
}

/** Actions available on a notes file (explorer context menu and editor toolbar). */
export function fileMenuItems(fileId: string, nodeIds: string[]): MenuItem[] {
  const s = useStore.getState();
  return [
    { label: 'Open', Icon: FileText, run: () => s.openFile(fileId, { mode: 'notes' }) },
    { label: 'Version history', Icon: History, run: () => s.openFile(fileId, { mode: 'history' }) },
    ...(nodeIds.length
      ? [{ label: 'Show on graph', Icon: Network, run: () => { s.setActiveTab(0); s.selectNode(nodeIds[0]); } }]
      : []),
    'sep',
    { label: 'Summarise', Icon: Bot, run: () => void requestSummary(fileId) },
    'sep',
    { label: 'Reset topic…', Icon: RotateCcw, run: () => s.setDialog({ kind: 'reset', fileId }) },
    { label: 'Erase topic data…', Icon: Eraser, run: () => s.setDialog({ kind: 'erase', fileId }), danger: true },
  ];
}
