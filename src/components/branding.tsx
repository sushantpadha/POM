import { Bot, Hand, Pencil } from 'lucide-react';
import type { Branch, Provenance, SourceKind } from '../types';
import type { NodeStatus } from '../logic/graph';

export const BRANCH_COLOR: Record<Branch, string> = {
  root: 'var(--root)',
  ethics: 'var(--ethics)',
  worldview: 'var(--worldview)',
  goals: 'var(--goals)',
};

/** Hex versions for SVG fills that need alpha blending. Keep in sync with styles.css. */
export const BRANCH_HEX: Record<Branch, string> = {
  root: '#cfcac1',
  ethics: '#c4a882',
  worldview: '#8eaaa3',
  goals: '#a89db6',
};

export const ACCENT_HEX = '#a7b8a4';

export const BRANCH_LABEL: Record<Branch, string> = {
  root: 'Start',
  ethics: 'Ethics',
  worldview: 'Worldview / Beliefs',
  goals: 'Long-term Goals',
};

/** Plain state words, so the map needs no legend. Hidden topics are never drawn. */
export const STATUS_LABEL: Record<NodeStatus, string> = {
  locked: 'Hidden',
  available: 'New',
  'in-progress': 'In progress',
  answered: 'Reflected on',
};

export const PROVENANCE: Record<Provenance, { label: string; Icon: typeof Hand }> = {
  human: { label: 'Written by you', Icon: Hand },
  auto: { label: 'From your answer', Icon: Pencil },
  ai: { label: 'AI summary', Icon: Bot },
};

export const SOURCE_LABEL: Record<SourceKind, string> = {
  adapted: 'Adapted',
  informed: 'New · research-informed',
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

