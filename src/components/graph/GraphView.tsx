import { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { Maximize2, Minus, Plus, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/store';
import { MODEL } from '../../store/model';
import { NODE_BY_ID } from '../../data/nodes';
import { useDerived } from '../../hooks/useDerived';
import { globalExploration } from '../../logic/graph';
import { BRANCH_HEX, STATUS_LABEL } from '../branding';

interface SimNode extends SimulationNodeDatum {
  id: string;
  r: number;
}
type SimLink = SimulationLinkDatum<SimNode> & { id: string };

const RING = 140;

function radiusFor(id: string): number {
  if (id === 'root') return 21;
  return MODEL.depth[id] === 1 ? 15 : 11;
}

function arcPath(r: number, frac: number): string {
  const f = Math.min(Math.max(frac, 0.001), 0.999);
  const a = f * Math.PI * 2 - Math.PI / 2;
  const x = r * Math.cos(a);
  const y = r * Math.sin(a);
  return `M 0 ${-r} A ${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${x} ${y}`;
}

export function GraphView() {
  const { available, status, isNew, hasNewDescendants, tags } = useDerived();
  const responses = useStore((s) => s.responses);
  const selectedId = useStore((s) => s.selectedNodeId);
  const selectNode = useStore((s) => s.selectNode);
  const openQuestionnaire = useStore((s) => s.openQuestionnaire);
  const resetCounter = useStore((s) => s.graphResetCounter);
  const resetGraphView = useStore((s) => s.resetGraphView);
  const onboarded = useStore((s) => !!s.onboardedAt);

  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesRef = useRef<Map<string, SimNode>>(new Map());
  const [, setTick] = useState(0);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const [view, setView] = useState({ x: 400, y: 300, k: 1 });
  const viewRef = useRef(view);
  viewRef.current = view;
  const [hover, setHover] = useState<string | null>(null);
  const [spawned, setSpawned] = useState<Set<string>>(new Set());
  const interaction = useRef<
    | { kind: 'node'; id: string; sx: number; sy: number; moved: boolean }
    | { kind: 'pan'; sx: number; sy: number; vx: number; vy: number; moved: boolean }
    | null
  >(null);
  const [panning, setPanning] = useState(false);
  /** Fit the view once the layout settles (initial load and after "reset"). */
  const autoFit = useRef(true);
  const fitRef = useRef<() => void>(() => {});

  // Visible = discovered nodes + undiscovered nodes directly reachable from a discovered one.
  const visibleIds = useMemo(() => {
    return MODEL.order.filter(
      (id) => available.has(id) || MODEL.parents[id].some((p) => available.has(p)),
    );
  }, [available]);

  const links = useMemo(
    () =>
      MODEL.edges.filter((e) => visibleIds.includes(e.from) && visibleIds.includes(e.to)),
    [visibleIds],
  );

  // ── Size ───────────────────────────────────────────────────
  useEffect(() => {
    const el = svgRef.current!;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) => {
        if (prev.w === width && prev.h === height) return prev;
        // keep the graph centred when the workspace resizes
        setView((v) => ({ ...v, x: v.x + (width - prev.w) / 2, y: v.y + (height - prev.h) / 2 }));
        return { w: width, h: height };
      });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setSize({ w: r.width, h: r.height });
    setView({ x: r.width / 2, y: r.height / 2, k: 1 });
    return () => ro.disconnect();
  }, []);

  // ── Simulation ─────────────────────────────────────────────
  useEffect(() => {
    let frame = 0;
    const sim = forceSimulation<SimNode, SimLink>([])
      .force('charge', forceManyBody<SimNode>().strength(-300))
      .force(
        'link',
        forceLink<SimNode, SimLink>([])
          .id((d) => d.id)
          .distance(120)
          .strength(0.25),
      )
      .force('radial', forceRadial<SimNode>((d) => MODEL.depth[d.id] * RING, 0, 0).strength(0.9))
      .force('collide', forceCollide<SimNode>((d) => d.r + 26))
      .alphaDecay(0.035)
      .on('end', () => {
        if (autoFit.current) {
          autoFit.current = false;
          fitRef.current();
        }
      })
      .on('tick', () => {
        if (!frame) {
          frame = requestAnimationFrame(() => {
            frame = 0;
            setTick((t) => t + 1);
          });
        }
      });
    simRef.current = sim;
    return () => {
      sim.stop();
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const sim = simRef.current!;
    const map = nodesRef.current;
    const fresh: string[] = [];
    const initial = map.size === 0;
    for (const id of visibleIds) {
      if (map.has(id)) continue;
      // New nodes spawn next to an already placed parent.
      const parent = MODEL.parents[id].map((p) => map.get(p)).find(Boolean);
      const angle = Math.random() * Math.PI * 2;
      const n: SimNode = {
        id,
        r: radiusFor(id),
        x: parent ? (parent.x ?? 0) + Math.cos(angle) * 30 : Math.cos(angle) * MODEL.depth[id] * RING,
        y: parent ? (parent.y ?? 0) + Math.sin(angle) * 30 : Math.sin(angle) * MODEL.depth[id] * RING,
      };
      if (id === 'root') {
        n.fx = 0;
        n.fy = 0;
      }
      map.set(id, n);
      fresh.push(id);
    }
    for (const id of [...map.keys()]) if (!visibleIds.includes(id)) map.delete(id);
    sim.nodes([...map.values()]);
    (sim.force('link') as ReturnType<typeof forceLink<SimNode, SimLink>>).links(
      links.map((l) => ({ id: `${l.from}->${l.to}`, source: l.from, target: l.to })),
    );
    if (initial) {
      // Settle the first layout synchronously so the map doesn't fly in.
      sim.alpha(1);
      sim.tick(300);
      sim.alpha(0.05).restart();
      fitRef.current();
      setTick((t) => t + 1);
      return;
    }
    sim.alpha(fresh.length ? 0.7 : 0.3).restart();
    if (fresh.length && map.size > fresh.length) {
      setSpawned(new Set(fresh));
      const t = setTimeout(() => setSpawned(new Set()), 900);
      return () => clearTimeout(t);
    }
  }, [visibleIds, links]);

  // ── View helpers ───────────────────────────────────────────
  const fit = () => {
    const pts = [...nodesRef.current.values()];
    if (!pts.length) return;
    const xs = pts.map((p) => p.x ?? 0);
    const ys = pts.map((p) => p.y ?? 0);
    const minX = Math.min(...xs) - 90;
    const maxX = Math.max(...xs) + 90;
    const minY = Math.min(...ys) - 70;
    const maxY = Math.max(...ys) + 80;
    const rect = svgRef.current?.getBoundingClientRect();
    const w = rect?.width || sizeRef.current.w;
    const h = rect?.height || sizeRef.current.h;
    const k = Math.min(w / (maxX - minX), h / (maxY - minY), 1.35);
    setView({ k, x: w / 2 - ((minX + maxX) / 2) * k, y: h / 2 - ((minY + maxY) / 2) * k });
  };

  fitRef.current = fit;

  const zoomBy = (factor: number, cx = size.w / 2, cy = size.h / 2) => {
    setView((v) => {
      const k = Math.min(3, Math.max(0.3, v.k * factor));
      const f = k / v.k;
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f };
    });
  };

  // Reset view: release pinned nodes, re-run the layout, then fit once it settles.
  const firstReset = useRef(true);
  useEffect(() => {
    if (firstReset.current) {
      firstReset.current = false;
      return;
    }
    for (const n of nodesRef.current.values()) {
      if (n.id !== 'root') {
        n.fx = null;
        n.fy = null;
      }
    }
    autoFit.current = true;
    simRef.current?.alpha(0.8).restart();
  }, [resetCounter]);

  useEffect(() => {
    const el = svgRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomBy(Math.exp(-e.deltaY * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // ── Pointer interaction ────────────────────────────────────
  const toGraph = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const v = viewRef.current;
    return { x: (clientX - rect.left - v.x) / v.k, y: (clientY - rect.top - v.y) / v.k };
  };

  const onNodeDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    svgRef.current!.setPointerCapture(e.pointerId);
    interaction.current = { kind: 'node', id, sx: e.clientX, sy: e.clientY, moved: false };
  };

  const onBgDown = (e: React.PointerEvent) => {
    svgRef.current!.setPointerCapture(e.pointerId);
    interaction.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false };
  };

  const onMove = (e: React.PointerEvent) => {
    const it = interaction.current;
    if (!it) return;
    const dx = e.clientX - it.sx;
    const dy = e.clientY - it.sy;
    if (!it.moved && Math.hypot(dx, dy) > 4) {
      it.moved = true;
      if (it.kind === 'pan') setPanning(true);
    }
    if (!it.moved) return;
    if (it.kind === 'pan') {
      setView((v) => ({ ...v, x: it.vx + dx, y: it.vy + dy }));
    } else if (it.id !== 'root') {
      const n = nodesRef.current.get(it.id);
      if (!n) return;
      const p = toGraph(e.clientX, e.clientY);
      n.fx = p.x;
      n.fy = p.y;
      simRef.current?.alphaTarget(0.25).restart();
    }
  };

  const onUp = () => {
    const it = interaction.current;
    interaction.current = null;
    setPanning(false);
    simRef.current?.alphaTarget(0);
    if (!it || it.moved) return; // dragged nodes stay pinned where they were dropped
    if (it.kind === 'node') selectNode(it.id);
    else selectNode(null);
  };

  // ── Render ─────────────────────────────────────────────────
  const neighbours = useMemo(() => {
    if (!hover) return null;
    return new Set([hover, ...MODEL.parents[hover], ...MODEL.children[hover]]);
  }, [hover]);

  const exploration = globalExploration(MODEL, available);
  const answeredCount = Object.keys(responses).length;
  const hoverNode = hover ? nodesRef.current.get(hover) : null;

  return (
    <div className="graph-wrap">
      <svg
        ref={svgRef}
        className={`graph-svg ${panning ? 'panning' : ''}`}
        onPointerDown={onBgDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="application"
        aria-label="Question graph"
      >
        <defs>
          {(['active', 'latent'] as const).map((k) => (
            <marker
              key={k}
              id={`arrow-${k}`}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill={k === 'active' ? '#6f7380' : '#3b3e47'} />
            </marker>
          ))}
        </defs>
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {links.map((l) => {
            const a = nodesRef.current.get(l.from);
            const b = nodesRef.current.get(l.to);
            if (!a || !b || a.x == null || b.x == null) return null;
            const dx = b.x - a.x;
            const dy = (b.y ?? 0) - (a.y ?? 0);
            const len = Math.hypot(dx, dy) || 1;
            const x1 = a.x + (dx / len) * (a.r + 3);
            const y1 = (a.y ?? 0) + (dy / len) * (a.r + 3);
            const x2 = b.x - (dx / len) * (b.r + 5);
            const y2 = (b.y ?? 0) - (dy / len) * (b.r + 5);
            const active = l.tags.some((t) => tags.has(t));
            const dim = neighbours && l.from !== hover && l.to !== hover;
            const hl = hover && (l.from === hover || l.to === hover);
            return (
              <line
                key={`${l.from}->${l.to}`}
                className={`g-edge ${dim ? 'g-dim' : ''}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={active ? (hl ? '#9da1ad' : '#555965') : '#33363e'}
                strokeWidth={hl ? 1.6 : 1.1}
                strokeDasharray={active ? undefined : '3 4'}
                markerEnd={`url(#arrow-${active ? 'active' : 'latent'})`}
              />
            );
          })}
          {visibleIds.map((id) => {
            const n = nodesRef.current.get(id);
            if (!n || n.x == null) return null;
            const node = NODE_BY_ID[id];
            const st = status[id];
            const color = BRANCH_HEX[node.branch];
            const r = st === 'locked' ? n.r * 0.75 : n.r;
            const qs = MODEL.questionsByNode[id];
            const frac = qs.length ? qs.filter((q) => responses[q.id]).length / qs.length : 0;
            const selected = selectedId === id;
            const dim = neighbours && !neighbours.has(id);
            const fresh = isNew(id);
            const newBelow = st !== 'locked' && hasNewDescendants(id);
            const invite = id === 'root' && !onboarded;
            return (
              <g
                key={id}
                transform={`translate(${n.x},${n.y})`}
                className={`g-node ${st} ${selected ? 'selected' : ''} ${dim ? 'g-dim' : ''}`}
                onPointerDown={(e) => onNodeDown(e, id)}
                onPointerEnter={() => setHover(id)}
                onPointerLeave={() => setHover((h) => (h === id ? null : h))}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (st !== 'locked') openQuestionnaire(id);
                }}
                data-node={id}
              >
                <g className={spawned.has(id) ? 'spawn' : undefined}>
                  {(fresh || invite) && (
                    <circle
                      className="pulse"
                      stroke={color}
                      style={{ '--r0': `${r + 2}px`, '--r1': `${r + 16}px` } as React.CSSProperties}
                      r={r + 2}
                    />
                  )}
                  <circle className="halo" r={r + 5} stroke={selected ? '#e8e9ee' : color} />
                  {st === 'locked' ? (
                    <>
                      <circle r={r} fill="#15161a" stroke="#4a4d57" strokeWidth={1.2} strokeDasharray="2.5 2.5" />
                      <text textAnchor="middle" dy="0.35em" fontSize={r} fill="#5d606b" style={{ pointerEvents: 'none' }}>
                        ?
                      </text>
                    </>
                  ) : st === 'answered' ? (
                    <circle r={r} fill={color} fillOpacity={id === 'root' ? 0.9 : 0.82} stroke={color} strokeWidth={1.5} />
                  ) : st === 'in-progress' ? (
                    <>
                      <circle r={r} fill={color} fillOpacity={0.12} stroke={color} strokeOpacity={0.35} strokeWidth={2} />
                      <path d={arcPath(r, frac)} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
                    </>
                  ) : (
                    <circle r={r} fill="#16171b" stroke={color} strokeWidth={2} />
                  )}
                  {id === 'root' && (
                    <text textAnchor="middle" dy="0.35em" fontSize={13} fontWeight={600} fill={st === 'answered' ? '#17181c' : color} style={{ pointerEvents: 'none' }}>
                      ?
                    </text>
                  )}
                  {newBelow && (
                    <g transform={`translate(${r * 0.78},${-r * 0.78})`}>
                      <circle r={4.5} fill="#8ea4f5" stroke="#111215" strokeWidth={1.5} />
                    </g>
                  )}
                </g>
                <text className="label" textAnchor="middle" y={r + 16}>
                  {st === 'locked' ? 'undiscovered' : node.name}
                  {fresh && (
                    <tspan fill="#8ea4f5" fontSize={9.5} fontWeight={600} dx={5}>
                      NEW
                    </tspan>
                  )}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {hoverNode && hover && !interaction.current && (
        <div
          className="graph-tip"
          style={{
            left: (hoverNode.x ?? 0) * view.k + view.x + 18,
            top: (hoverNode.y ?? 0) * view.k + view.y + 14,
          }}
        >
          {status[hover] === 'locked' ? (
            <>
              <b>Undiscovered</b>
              <div>
                Answer a question tagged{' '}
                {NODE_BY_ID[hover].parentTags.map((t, i) => (
                  <span key={t}>
                    {i > 0 && ' or '}
                    <span className="mono">#{t}</span>
                  </span>
                ))}{' '}
                to discover it.
              </div>
            </>
          ) : (
            <>
              <b>{NODE_BY_ID[hover].name}</b> · {STATUS_LABEL[status[hover]]}
              {hasNewDescendants(hover) && <div style={{ color: 'var(--accent)' }}>Has newly unlocked descendants</div>}
              <div className="faint">Click to inspect · double-click to open questionnaire</div>
            </>
          )}
        </div>
      )}

      <div className="graph-overlay tl">
        <div className="glass graph-hint">
          {!onboarded ? (
            <span>
              Click <b>Who am I?</b> to begin onboarding
            </span>
          ) : (
            <>
              <span>
                <b>{answeredCount}</b> answers
              </span>
              <span>
                Explored <b>+{exploration.nodes}</b> nodes · <b>+{exploration.questions}</b> questions
              </span>
            </>
          )}
        </div>
      </div>

      <div className="graph-overlay tr">
        <div className="glass graph-tools">
          <button className="icon-btn" title="Zoom in" onClick={() => zoomBy(1.2)}>
            <Plus size={15} />
          </button>
          <button className="icon-btn" title="Zoom out" onClick={() => zoomBy(1 / 1.2)}>
            <Minus size={15} />
          </button>
          <button className="icon-btn" title="Fit to screen" onClick={fit}>
            <Maximize2 size={14} />
          </button>
          <button className="icon-btn" title="Reset layout and view" onClick={resetGraphView}>
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="graph-overlay bl">
        <div className="glass legend">
          <span className="legend-item">
            <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="#15161a" stroke="#4a4d57" strokeDasharray="2 2" /></svg>
            Undiscovered
          </span>
          <span className="legend-item">
            <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="none" stroke="#a1a3ad" strokeWidth="1.6" /></svg>
            Available
          </span>
          <span className="legend-item">
            <svg width="14" height="14">
              <circle cx="7" cy="7" r="5" fill="rgba(161,163,173,0.12)" stroke="rgba(161,163,173,0.35)" strokeWidth="1.6" />
              <path d={arcPath(5, 0.4)} transform="translate(7,7)" fill="none" stroke="#a1a3ad" strokeWidth="2" />
            </svg>
            In progress
          </span>
          <span className="legend-item">
            <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="#a1a3ad" /></svg>
            Answered
          </span>
          <span className="legend-item">
            <svg width="14" height="14"><circle cx="7" cy="7" r="3.5" fill="#8ea4f5" /></svg>
            New descendants
          </span>
          <span className="legend-item">
            <svg width="22" height="14"><line x1="1" y1="7" x2="21" y2="7" stroke="#555965" strokeDasharray="3 3" /></svg>
            Not yet activated
          </span>
        </div>
      </div>
    </div>
  );
}
