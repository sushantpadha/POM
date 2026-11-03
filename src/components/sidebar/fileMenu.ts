import { Bot, Eraser, FileText, GitCompare, History, Network, RotateCcw, type LucideIcon } from 'lucide-react';
import { useStore } from '../../store/store';

export type MenuItem = { label: string; Icon: LucideIcon; run: () => void; danger?: boolean } | 'sep';

/** Summarise (pre-written or rule-based here), shared by the toolbar, the explorer menu and the file panel. */
export function requestSummary(fileId: string) {
  const s = useStore.getState();
  s.openFile(fileId, { mode: 'notes' });
  if (!s.proposeSummary(fileId)) {
    s.toast({
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
    { label: 'Changes over time', Icon: GitCompare, run: () => s.openFile(fileId, { mode: 'changes' }) },
    { label: 'Version history', Icon: History, run: () => s.openFile(fileId, { mode: 'history' }) },
    ...(nodeIds.length
      ? [{ label: 'Show on graph', Icon: Network, run: () => { s.setActiveTab(0); s.selectNode(nodeIds[0]); } }]
      : []),
    'sep',
    { label: 'Summarise', Icon: Bot, run: () => requestSummary(fileId) },
    'sep',
    { label: 'Reset topic…', Icon: RotateCcw, run: () => s.setDialog({ kind: 'reset', fileId }) },
    { label: 'Erase topic data…', Icon: Eraser, run: () => s.setDialog({ kind: 'erase', fileId }), danger: true },
  ];
}
