import React from 'react';
import { sankey, sankeyJustify, sankeyLinkHorizontal } from 'd3-sankey';
import type { SankeyNode } from 'd3-sankey';
import { X } from 'lucide-react';
import { Card } from './Card';
import { Section } from './Section';
import { UpdateApplicationModal } from './UpdateApplicationModal';
import { useApplications } from '../hooks/useApplications';
import type { ApplicationEventType, JobApplication } from '../types';
import { eventTypes } from '../eventTypes';

const minWidth = 400;
const height = 320;
const margins = { top: 10, bottom: 10, left: 10, right: 10 };
const nodeWidth = 12;
const fontSize = 12;

// Interview stages in the order an application moves through them
const stageOrder: ApplicationEventType[] = [
  'phone_screen',
  'technical_screen',
  'coding_interview',
  'onsite',
];

type Origin = 'inbound' | 'outbound' | 'unspecified';
type NodeId = Origin | ApplicationEventType | 'in_progress' | 'no_response';

// Where an application came from; flows keep their origin's color through every stage
const originNodes: Record<Origin, { label: string; color: string }> = {
  inbound: { label: 'Inbound', color: 'var(--source-inbound)' },
  outbound: { label: 'Outbound', color: 'var(--source-outbound)' },
  unspecified: { label: 'Unspecified', color: 'var(--subtle-foreground)' },
};

const getOrigin = (d: JobApplication): Origin => d.source ?? 'unspecified';

const extraNodes: Record<Origin | 'in_progress' | 'no_response', { label: string; color: string }> = {
  ...originNodes,
  in_progress: { label: 'In Progress', color: 'var(--border-strong)' },
  no_response: { label: 'No Response', color: 'var(--border-strong)' },
};

const nodeInfo = (id: NodeId) =>
  id in extraNodes ? extraNodes[id as keyof typeof extraNodes] : eventTypes[id as ApplicationEventType];

interface NodeDatum {
  id: NodeId;
}
interface LinkDatum {
  key: string;
  source: NodeId;
  target: NodeId;
  origin: Origin;
  value: number;
  applications: JobApplication[];
}
type LaidOutNode = SankeyNode<NodeDatum, LinkDatum>;

// What the user clicked (or is hovering): a whole stage, or one band between two stages
type Selection = { kind: 'node'; id: NodeId } | { kind: 'link'; key: string };

const sameSelection = (a: Selection | undefined, b: Selection) =>
  !!a &&
  a.kind === b.kind &&
  (a.kind === 'node' ? a.id === (b as { id: NodeId }).id : a.key === (b as { key: string }).key);

// The stages an application passed through, from its origin to where it stands now.
// Stages are deduped and put in pipeline order, so repeated or out-of-order events
// still produce a forward-only path.
const getPath = (d: JobApplication): NodeId[] => {
  const types = new Set(d.events.map((e) => e.type));
  const stages = stageOrder.filter((t) => types.has(t));
  let outcome: NodeId;
  if (types.has('offer')) outcome = 'offer';
  else if (types.has('rejected')) outcome = 'rejected';
  else if (stages.length > 0) outcome = 'in_progress';
  else outcome = 'no_response';
  return [getOrigin(d), ...stages, outcome];
};

const buildGraph = (applications: JobApplication[]) => {
  const links = new Map<string, LinkDatum>();
  const nodeApps = new Map<NodeId, JobApplication[]>();
  for (const app of applications) {
    const path = getPath(app);
    const origin = getOrigin(app);
    path.forEach((id) => nodeApps.set(id, [...(nodeApps.get(id) ?? []), app]));
    // Links are keyed by origin too, so inbound and outbound flows stay separate bands
    for (let i = 0; i < path.length - 1; i++) {
      const key = `${origin}:${path[i]}->${path[i + 1]}`;
      const link = links.get(key) ?? {
        key,
        source: path[i],
        target: path[i + 1],
        origin,
        value: 0,
        applications: [],
      };
      link.value += 1;
      link.applications.push(app);
      links.set(key, link);
    }
  }
  return {
    nodes: [...nodeApps.keys()].map((id) => ({ id })),
    links: [...links.values()],
    nodeApps,
  };
};

export function PipelineSankey() {
  const [width, setWidth] = React.useState(900);
  const [hovered, setHovered] = React.useState<Selection>();
  const [selected, setSelected] = React.useState<Selection>();
  const [clickedRow, setClickedRow] = React.useState<JobApplication>();
  const [pointer, setPointer] = React.useState({ x: 0, y: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(Math.floor(entry.contentRect.width), minWidth));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Escape clears the pinned selection
  React.useEffect(() => {
    if (!selected) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(undefined);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  const data = useApplications();
  const applications = React.useMemo(() => data.data ?? [], [data.data]);

  const graph = React.useMemo(() => {
    if (applications.length === 0) return undefined;
    const layout = sankey<NodeDatum, LinkDatum>()
      .nodeId((n) => n.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(nodeWidth)
      .nodePadding(16)
      .extent([
        [margins.left, margins.top],
        [width - margins.right, height - margins.bottom],
      ]);
    const { nodes, links, nodeApps } = buildGraph(applications);
    // d3-sankey mutates its input, so hand it fresh copies
    return {
      ...layout({ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) }),
      nodeApps,
    };
  }, [applications, width]);

  const appsFor = (s: Selection | undefined): JobApplication[] | undefined => {
    if (!s || !graph) return undefined;
    if (s.kind === 'node') return graph.nodeApps.get(s.id);
    return graph.links.find((l) => l.key === s.key)?.applications;
  };

  const describe = (s: Selection) => {
    if (s.kind === 'node') return nodeInfo(s.id).label;
    const link = graph?.links.find((l) => l.key === s.key);
    if (!link) return '';
    const source = (link.source as LaidOutNode).id;
    const target = (link.target as LaidOutNode).id;
    return `${originNodes[link.origin].label} · ${nodeInfo(source).label} → ${nodeInfo(target).label}`;
  };

  // A pinned selection wins; otherwise hovering previews the same tracing
  const focus = selected ?? hovered;
  const focusApps = appsFor(focus);
  const focusIds = focusApps ? new Set(focusApps.map((a) => a.id)) : undefined;
  // Most recent activity first; apps with no events fall back to their applied date
  const lastActivity = (a: JobApplication) =>
    a.events.reduce((max, e) => (e.date > max ? e.date : max), a.date_applied ?? '');
  const selectedApps = appsFor(selected)?.toSorted((a, b) => lastActivity(b).localeCompare(lastActivity(a)));
  const countIn = (apps: JobApplication[]) =>
    focusIds ? apps.filter((a) => focusIds.has(a.id)).length : apps.length;

  const toggle = (s: Selection) => setSelected((prev) => (sameSelection(prev, s) ? undefined : s));

  const linkPath = sankeyLinkHorizontal<NodeDatum, LinkDatum>();

  const trackPointer = (event: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) setPointer({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  // Each band is drawn faint, then the part carrying the focused applications is drawn on
  // top at full strength, so a selection's journey shows up across every stage it touched
  const links = graph?.links.map((link) => {
    const color = originNodes[link.origin].color;
    const fullWidth = Math.max(link.width ?? 1, 1);
    const k = countIn(link.applications);
    const traceWidth = (fullWidth * k) / link.value;
    // Pin the traced part to the top edge of the band
    const shift = (fullWidth - traceWidth) / 2;
    const trace =
      focusIds && k > 0
        ? linkPath({ ...link, y0: (link.y0 ?? 0) - shift, y1: (link.y1 ?? 0) - shift })
        : undefined;
    const s: Selection = { kind: 'link', key: link.key };
    return (
      <g
        key={link.key}
        style={{ cursor: 'pointer' }}
        onMouseEnter={() => setHovered(s)}
        onMouseMove={trackPointer}
        onMouseLeave={() => setHovered(undefined)}
        onClick={() => toggle(s)}
      >
        <path
          d={linkPath(link) ?? undefined}
          fill="none"
          stroke={color}
          strokeWidth={fullWidth}
          strokeOpacity={focusIds ? 0.08 : 0.3}
          style={{ transition: 'stroke-opacity 120ms' }}
        />
        {trace && (
          <path
            d={trace}
            fill="none"
            stroke={color}
            strokeWidth={Math.max(traceWidth, 1)}
            strokeOpacity={sameSelection(focus, s) ? 0.75 : 0.55}
            className="pointer-events-none"
          />
        )}
      </g>
    );
  });

  const nodes = graph?.nodes.map((node) => {
    const { label, color } = nodeInfo(node.id);
    const x0 = node.x0 ?? 0;
    const x1 = node.x1 ?? 0;
    const y0 = node.y0 ?? 0;
    const y1 = node.y1 ?? 0;
    const total = node.value ?? 0;
    const k = countIn(graph.nodeApps.get(node.id) ?? []);
    const s: Selection = { kind: 'node', id: node.id };
    const isSelected = sameSelection(selected, s);
    // Labels sit outside the node, flipping to the left side for the right half of the chart
    const labelOnLeft = x0 > width / 2;
    return (
      <g
        key={node.id}
        style={{ cursor: 'pointer' }}
        opacity={focusIds && k === 0 ? 0.35 : 1}
        onMouseEnter={() => setHovered(s)}
        onMouseMove={trackPointer}
        onMouseLeave={() => setHovered(undefined)}
        onClick={() => toggle(s)}
      >
        {/* Wider invisible hit area so thin nodes are easy to click */}
        <rect x={x0 - 4} y={y0} width={x1 - x0 + 8} height={Math.max(y1 - y0, 8)} fill="transparent" />
        <rect
          x={x0}
          y={y0}
          width={x1 - x0}
          height={Math.max(y1 - y0, 1)}
          rx={2}
          fill={color}
          className={isSelected ? 'stroke-foreground' : undefined}
          strokeWidth={isSelected ? 1.5 : 0}
        />
        <text
          x={labelOnLeft ? x0 - 6 : x1 + 6}
          y={(y0 + y1) / 2}
          dy="0.35em"
          textAnchor={labelOnLeft ? 'end' : 'start'}
          fontSize={fontSize}
          className="pointer-events-none fill-foreground"
          fontWeight={isSelected ? 600 : undefined}
        >
          {label}{' '}
          <tspan className="fill-subtle-foreground tabular-nums">
            {focusIds ? `${k} of ${total}` : total}
          </tspan>
        </text>
      </g>
    );
  });

  // Hover tooltip; suppressed while something is pinned, since the panel below shows the details
  let tooltip;
  if (hovered && !selected) {
    const apps = appsFor(hovered) ?? [];
    tooltip = (
      <>
        <div className="text-[13px] font-medium">{describe(hovered)}</div>
        <div className="text-muted-foreground">
          {apps.length} {apps.length === 1 ? 'application' : 'applications'}
          {hovered.kind === 'node' &&
            ` · ${Math.round((apps.length / applications.length) * 100)}% of all`}
        </div>
        <div className="mt-1 text-muted-foreground">Click to trace</div>
      </>
    );
  }

  // Outcome breakdown for the pinned selection, e.g. "2 offers · 3 rejected"
  const outcomeSummary = selectedApps
    ? (['offer', 'rejected', 'in_progress', 'no_response'] as NodeId[])
        .map((id) => ({ id, n: selectedApps.filter((a) => getPath(a).at(-1) === id).length }))
        .filter(({ n }) => n > 0)
    : [];

  const details = selected && selectedApps && (
    <div className="mt-3 border-t pt-3">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-semibold">{describe(selected)}</span>
        <span className="text-muted-foreground tabular-nums">
          {selectedApps.length} {selectedApps.length === 1 ? 'application' : 'applications'}
        </span>
        {outcomeSummary.map(({ id, n }) => (
          <span key={id} className="flex items-center gap-1.5 text-muted-foreground">
            <span className="size-2 rounded-full" style={{ backgroundColor: nodeInfo(id).color }} />
            {n} {nodeInfo(id).label}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setSelected(undefined)}
          className="ml-auto flex cursor-pointer items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
          Clear
        </button>
      </div>
      <div>
        {selectedApps.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => setClickedRow(app)}
            className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent"
          >
            <span className="w-40 shrink-0 truncate font-medium">{app.name ?? 'Untitled'}</span>
            <span className="w-48 shrink-0 truncate text-muted-foreground">{app.role}</span>
            <span className="flex min-w-0 flex-wrap items-center gap-1 text-muted-foreground">
              {getPath(app).map((id, i) => (
                <React.Fragment key={id}>
                  {i > 0 && <span className="text-subtle-foreground">→</span>}
                  <span className="flex items-center gap-1">
                    <span className="size-2 rounded-full" style={{ backgroundColor: nodeInfo(id).color }} />
                    {nodeInfo(id).label}
                  </span>
                </React.Fragment>
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Section
      title="Pipeline Flow"
      actions={
        !selected && graph && (
          <span className="text-xs text-muted-foreground">Click a stage or flow to trace it</span>
        )
      }
    >
      {clickedRow && (
        <UpdateApplicationModal
          open={!!clickedRow}
          onClose={() => setClickedRow(undefined)}
          data={clickedRow}
        />
      )}
      <div ref={containerRef} className="relative">
        {graph ? (
          <svg
            height={height}
            width={width}
            className="block"
            // Clicking empty space clears the selection
            onClick={(e) => e.target === e.currentTarget && setSelected(undefined)}
          >
            <g>{links}</g>
            <g>{nodes}</g>
          </svg>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">No applications yet</div>
        )}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              top: pointer.y - 12,
              left: pointer.x,
              transform: 'translate(-50%, -100%)',
              pointerEvents: 'none',
              zIndex: 5,
              whiteSpace: 'nowrap',
            }}
          >
            <Card>{tooltip}</Card>
          </div>
        )}
      </div>
      {details}
    </Section>
  );
}
