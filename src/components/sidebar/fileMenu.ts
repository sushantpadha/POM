import { FileText, Network, type LucideIcon } from 'lucide-react';
import { useStore } from '../../store/store';

export type MenuItem = { label: string; Icon: LucideIcon; run: () => void; danger?: boolean } | 'sep';

/** Actions available on a notes file (explorer context menu and editor toolbar). */
export function fileMenuItems(fileId: string, nodeIds: string[]): MenuItem[] {
  const s = useStore.getState();
  return [
    { label: 'Open', Icon: FileText, run: () => s.openFile(fileId, { mode: 'notes' }) },
    ...(nodeIds.length
      ? [{ label: 'Show on graph', Icon: Network, run: () => { s.setActiveTab(0); s.selectNode(nodeIds[0]); } }]
      : []),
  ];
}
