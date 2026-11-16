import { Bot, Hand, Pencil } from 'lucide-react';
import type { Branch, Provenance, SourceKind } from '../types';
import type { NodeStatus } from '../logic/graph';

export const BRANCH_COLOR: Record<Branch, string> = {
  root: 'var(--root)',
  worldview: 'var(--worldview)',
  moral: 'var(--moral)',
  priorities: 'var(--priorities)',
  identity: 'var(--identity)',
  goals: 'var(--goals)',
};

/** Hex versions for SVG fills that need alpha blending. Keep in sync with styles.css. */
export const BRANCH_HEX: Record<Branch, string> = {
  root: '#cfcac1',
  worldview: '#5cb8ab',
  moral: '#e38d73',
  priorities: '#c9cf63',
  identity: '#e07fb0',
  goals: '#6fa8e8',
};

export const ACCENT_HEX = '#a7b8a4';

export const BRANCH_LABEL: Record<Branch, string> = {
  root: 'Start',
  worldview: 'Worldview & Beliefs',
  moral: 'Moral Principles',
  priorities: 'Personal Priorities',
  identity: 'Identity & Self-concept',
  goals: 'Goals & Aspirations',
};

export const STATUS_LABEL: Record<NodeStatus, string> = {
  locked: 'Not opened yet',
  available: 'Open',
  'in-progress': 'In progress',
  answered: 'Answered',
};

export const PROVENANCE: Record<Provenance, { label: string; Icon: typeof Hand }> = {
  human: { label: 'Written by you', Icon: Hand },
  auto: { label: 'Generated from one of your answers', Icon: Pencil },
  ai: { label: 'Summary (AI in a full version; pre-written or rule-based here)', Icon: Bot },
};

export const SOURCE_LABEL: Record<SourceKind, string> = {
  adapted: 'Adapted',
  informed: 'Informed',
  new: 'New',
};

export function ProvenanceIcon({ p, size = 13 }: { p: Provenance; size?: number }) {
  const { Icon, label } = PROVENANCE[p];
  return (
    <span className={`prov ${p}`} title={label} aria-label={label}>
      <Icon size={size} strokeWidth={1.7} />
    </span>
  );
}

export function StatusDot({ status, branch }: { status: NodeStatus; branch: Branch }) {
  return (
    <span
      className={`status-dot ${status}`}
      style={{ color: status === 'locked' ? 'var(--text-faint)' : BRANCH_COLOR[branch], flex: 'none' }}
      title={STATUS_LABEL[status]}
    />
  );
}

export function StatusPill({ status, branch }: { status: NodeStatus; branch: Branch }) {
  return (
    <span className="status-pill">
      <StatusDot status={status} branch={branch} />
      <span>{STATUS_LABEL[status]}</span>
    </span>
  );
}
