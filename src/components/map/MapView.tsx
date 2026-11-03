import { useState } from 'react';
import type { Branch } from '../../types';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { fmtDate } from '../../logic/format';
import { BRANCH_HEX, BRANCH_LABEL, STATUS_LABEL } from '../branding';

const AREAS: Branch[] = ['ethics', 'worldview', 'goals'];

/** Parents other than the root, in words: "Ethics or Long-term Goals". */
function routes(id: string, visible: Set<string>): string[] {
  return MODEL.parents[id].filter((p) => p !== 'root' && visible.has(p)).map((p) => NODE_BY_ID[p].name);
}

export function MapView({ nodeId, full: fullInitial }: { nodeId?: string; full?: boolean }) {
  const { available, status } = useDerived();
  const progress = useStore((s) => s.progress);
  const go = useStore((s) => s.go);
  const visible = new Set([...available].filter((id) => id !== 'root'));

  const latest = Object.entries(progress)
    .filter(([, p]) => p.completedAt)
    .sort((a, b) => (b[1].completedAt! > a[1].completedAt! ? 1 : -1))[0]?.[0];
  const startArea = NODE_BY_ID[nodeId ?? latest ?? 'ethics'].branch;
  const [area, setArea] = useState<Branch>(startArea === 'root' ? 'ethics' : startArea);
  const [full, setFull] = useState(!!fullInitial);
  const select = (id: string) => go({ name: 'map', nodeId: id === nodeId ? undefined : id, full });

  return (
    <div className="page wide" style={{ maxWidth: full ? 900 : 680 }}>
      <h1 className="page-title" style={{ marginBottom: 22 }}>Map</h1>
      <div className="map-switch">
        {!full &&
          AREAS.map((a) => (
            <button key={a} className={area === a ? 'on' : ''} onClick={() => setArea(a)}>
              {BRANCH_LABEL[a]}
            </button>
          ))}
        {full && <span className="muted">All topics you have opened</span>}
        <span className="sep" />
        <button onClick={() => setFull(!full)}>{full ? 'List' : 'Full map'}</button>
      </div>

      {full ? (
        <FullMap visible={visible} selected={nodeId} onSelect={select} />
      ) : (
        <div>
          {MODEL.order
            .filter((id) => visible.has(id) && NODE_BY_ID[id].branch === area)
            .map((id) => {
              const r = routes(id, visible);
              return (
                <div key={id}>
                  <button className={`topic-row ${nodeId === id ? 'sel' : ''}`} onClick={() => select(id)}>
                    <span className="t">
                      {NODE_BY_ID[id].name}
                      {r.length > 1 && <span className="route">Opens from {r.join(' or ')}</span>}
                    </span>
                    <span className="state">{STATUS_LABEL[status[id]]}</span>
                  </button>
                  {nodeId === id && <TopicCard id={id} visible={visible} />}
                </div>
              );
            })}
        </div>
      )}
      {full && nodeId && visible.has(nodeId) && <TopicCard id={nodeId} visible={visible} />}
    </div>
  );
}

function TopicCard({ id, visible }: { id: string; visible: Set<string> }) {
  const node = NODE_BY_ID[id];
  const { status } = useDerived();
  const progress = useStore((s) => s.progress[id]);
  const files = useStore((s) => s.files);
  const openFile = useStore((s) => s.openFile);
  const openReflection = useStore((s) => s.openReflection);
  const st = status[id];
  const fileIds = [...new Set(MODEL.questionsByNode[id].flatMap((q) => q.fileIds))].filter((f) => files[f].current.entries.length > 0);
  const nextOpen = MODEL.children[id].filter((c) => visible.has(c));
  const hidden = MODEL.children[id].filter((c) => !visible.has(c)).length;

  return (
    <div className="card">
      <h3>{node.name}</h3>
      <p className="meta">
        {STATUS_LABEL[st]}
        {progress?.completedAt && ` · last reflected ${fmtDate(progress.completedAt)}`}
      </p>
      <p className="muted">{node.description}</p>
      {fileIds.length > 0 && (
        <p className="muted">
          Notes:{' '}
          {fileIds.map((f, i) => (
            <span key={f}>
              {i > 0 && ', '}
              <a onClick={() => openFile(f)}>{files[f].name === 'main' ? `${files[f].title}` : files[f].title}</a>
            </span>
          ))}
        </p>
      )}
      {(nextOpen.length > 0 || hidden > 0) && (
        <p className="muted">
          {nextOpen.length > 0 && <>Leads to {nextOpen.map((c) => NODE_BY_ID[c].name).join(', ')}. </>}
          {hidden > 0 && 'More may open as you reflect.'}
        </p>
      )}
      <div className="actions">
        <button className="btn primary small" onClick={() => openReflection(id)}>
          {progress?.completedAt ? 'Revisit this topic' : progress ? 'Continue' : 'Start reflecting'}
        </button>
      </div>
    </div>
  );
}

/** A fixed left-to-right layout by depth: no physics, no motion. */
function FullMap({ visible, selected, onSelect }: { visible: Set<string>; selected?: string; onSelect: (id: string) => void }) {
  const { status } = useDerived();
  const cols: string[][] = [];
  const order: Branch[] = ['ethics', 'worldview', 'goals'];
  const ids = MODEL.order.filter((id) => visible.has(id));
  for (const id of ids) (cols[MODEL.depth[id] - 1] ??= []).push(id);
  cols.forEach((c) => c.sort((a, b) => order.indexOf(NODE_BY_ID[a].branch) - order.indexOf(NODE_BY_ID[b].branch)));

  const COL = 250;
  const ROW = 70;
  const pos: Record<string, { x: number; y: number }> = {};
  const rows = Math.max(...cols.map((c) => c?.length ?? 0), 1);
  cols.forEach((c, ci) =>
    c?.forEach((id, ri) => {
      const offset = ((rows - c.length) * ROW) / 2;
      pos[id] = { x: 20 + ci * COL, y: 30 + offset + ri * ROW };
    }),
  );
  const width = Math.max(cols.length * COL, 400);
  const height = rows * ROW + 20;
  const edges = MODEL.edges.filter((e) => pos[e.from] && pos[e.to]);

  return (
    <svg className="map-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="list" aria-label="Map of opened topics">
      {edges.map((e) => {
        const a = pos[e.from];
        const b = pos[e.to];
        // Leave from the end of the label, so lines never cross text.
        const sx = a.x + 24 + NODE_BY_ID[e.from].name.length * 7.2;
        const mx = (sx + b.x) / 2;
        return (
          <path
            key={`${e.from}-${e.to}`}
            d={`M ${sx} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x - 10} ${b.y}`}
            fill="none"
            stroke="#3a3835"
            strokeWidth={1.2}
          />
        );
      })}
      {ids.map((id) => {
        const p = pos[id];
        const st = status[id];
        const color = BRANCH_HEX[NODE_BY_ID[id].branch];
        return (
          <g
            key={id}
            role="listitem"
            className={`node ${selected === id ? 'sel' : ''}`}
            transform={`translate(${p.x},${p.y})`}
            onClick={() => onSelect(id)}
            tabIndex={0}
            onKeyDown={(ev) => ev.key === 'Enter' && onSelect(id)}
            data-node={id}
          >
            <circle r={7} fill={st === 'answered' ? color : st === 'in-progress' ? `${color}66` : '#151515'} stroke={color} strokeWidth={1.5} />
            {selected === id && <circle r={12} fill="none" stroke="#dcd8d0" strokeWidth={1} />}
            <text x={16} y={4}>
              {NODE_BY_ID[id].name}
            </text>
            <text x={16} y={21} style={{ fontSize: 11.5, fill: '#6c6861' }}>
              {STATUS_LABEL[st]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
