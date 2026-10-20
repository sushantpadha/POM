import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useStore, type FloatingPanel } from '../../store/store';
import { useMaintenance } from '../../hooks/useMaintenance';
import { AskPanel } from './AskPanel';
import { RetakesPanel } from './RetakesPanel';
import { TensionsPanel } from './TensionsPanel';

export function FloatingControls() {
  const floating = useStore((s) => s.floating);
  const setFloating = useStore((s) => s.setFloating);
  const { openTensions, retakes } = useMaintenance();

  const toggle = (p: Exclude<FloatingPanel, null>) => setFloating(floating === p ? null : p);

  return (
    <>
      <div className="fab-stack">
        <button className={`fab ${floating === 'ask' ? 'on' : ''}`} title="Ask the model" aria-label="Ask the model" onClick={() => toggle('ask')}>
          ?
        </button>
        <button className={`fab ${floating === 'retakes' ? 'on' : ''}`} title="Suggested retakes" aria-label="Suggested retakes" onClick={() => toggle('retakes')}>
          ★{retakes.length > 0 && <span className="count">{retakes.length}</span>}
        </button>
        <button className={`fab ${floating === 'tensions' ? 'on' : ''}`} title="Potential tensions" aria-label="Potential tensions" onClick={() => toggle('tensions')}>
          !{openTensions.length > 0 && <span className="count warn">{openTensions.length}</span>}
        </button>
      </div>
      {floating === 'ask' && <AskPanel />}
      {floating === 'retakes' && <RetakesPanel />}
      {floating === 'tensions' && <TensionsPanel />}
    </>
  );
}

export function FloatShell({ icon, title, sub, children, foot }: { icon: ReactNode; title: string; sub?: ReactNode; children: ReactNode; foot?: ReactNode }) {
  const setFloating = useStore((s) => s.setFloating);
  return (
    <div className="float-panel" role="dialog" aria-label={title}>
      <div className="fp-head">
        <span className="ic">{icon}</span>
        <div className="grow">
          <h3>{title}</h3>
          {sub && <div className="faint" style={{ fontSize: 11.5 }}>{sub}</div>}
        </div>
        <button className="icon-btn" aria-label="Close" onClick={() => setFloating(null)}>
          <X size={15} />
        </button>
      </div>
      <div className="fp-body">{children}</div>
      {foot && <div className="fp-foot">{foot}</div>}
    </div>
  );
}
