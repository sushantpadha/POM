import { Bot, Hand, Pencil } from 'lucide-react';
import type { Branch, Provenance } from '../types';
import type { NodeStatus } from '../logic/graph';

export const BRANCH_COLOR: Record<Branch, string> = {
  root: 'var(--root)',
  ethics: 'var(--ethics)',
  worldview: 'var(--worldview)',
  goals: 'var(--goals)',
};

/** Hex versions for SVG fills that need alpha blending. */
export const BRANCH_HEX: Record<Branch, string> = {
  root: '#d8d9de',
  ethics: '#e0a95e',
  worldview: '#5ebcb2',
  goals: '#b39af2',
};

export const BRANCH_LABEL: Record<Branch, string> = {
  root: 'Start',
  ethics: 'Ethics',
  worldview: 'Worldview / Beliefs',
  goals: 'Long-term Goals',
};

export const STATUS_LABEL: Record<NodeStatus, string> = {
  locked: 'Undiscovered',
  available: 'Available',
  'in-progress': 'In progress',
  answered: 'Answered',
};

export const PROVENANCE: Record<Provenance, { label: string; Icon: typeof Hand }> = {
  human: { label: 'Human-written', Icon: Hand },
  auto: { label: 'Automatically generated', Icon: Pencil },
  ai: { label: 'AI-summarized', Icon: Bot },
};

export function ProvenanceIcon({ p, size = 13 }: { p: Provenance; size?: number }) {
  const { Icon, label } = PROVENANCE[p];
  return (
    <span className={`prov ${p}`} title={label} aria-label={label}>
      <Icon size={size} strokeWidth={1.8} />
    </span>
  );
}

export function StatusPill({ status, branch }: { status: NodeStatus; branch: Branch }) {
  return (
    <span className="status-pill" style={{ color: status === 'locked' ? 'var(--text-faint)' : BRANCH_COLOR[branch] }}>
      <span className={`status-dot ${status}`} />
      <span style={{ color: 'var(--text-dim)' }}>{STATUS_LABEL[status]}</span>
    </span>
  );
}
