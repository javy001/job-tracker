import React from 'react';
import { Card } from './Card';
import { UpdateApplicationModal } from './UpdateApplicationModal';
import { useApplications } from '../hooks/useApplications';
import type { JobApplication } from '../types';
import { closingEventTypes, eventTypes, formatEventTime } from '../eventTypes';
import * as d3 from 'd3';
import dayjs from 'dayjs';

const rowHeight = 26;
const minWidth = 400;
const margins = { top: 20, bottom: 30, left: 180, right: 20 };
const fontSize = 12;

const axisColor = '#b8b8b8';
const fontColor = '#808080';
const barColor = '#94a3b8';

const dateFormatter = d3.timeFormat('%b %d');

type EventFilter = 'all' | 'with_events' | 'no_events';

const eventFilterOptions: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'with_events', label: 'With events' },
  { value: 'no_events', label: 'No events' },
];

// Plot everything at noon so dates on the same day line up and sit centered on their tick
const toNoon = (date: dayjs.ConfigType) =>
  dayjs(date).startOf('day').add(12, 'hour').toDate();

const isClosed = (d: JobApplication) =>
  d.events.some((e) => closingEventTypes.includes(e.type));

// Applications stay in the pipeline until an offer or rejection, otherwise through
// today or their latest scheduled event, whichever is later
const getEndDate = (d: JobApplication, today: Date) => {
  const events = isClosed(d)
    ? d.events.filter((e) => closingEventTypes.includes(e.type))
    : d.events;
  const lastEvent = d3.max(events, (e) => toNoon(e.date));
  if (isClosed(d)) return lastEvent ?? today;
  return lastEvent && lastEvent > today ? lastEvent : today;
};

export function PipelineTimeline() {
  const [tooltipData, setTooltipData] = React.useState<JobApplication>();
  const [clickedRow, setClickedRow] = React.useState<JobApplication>();
  const [width, setWidth] = React.useState(900);
  const [eventFilter, setEventFilter] = React.useState<EventFilter>('with_events');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Track the container's width so the chart fills it and resizes with the window
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(Math.floor(entry.contentRect.width), minWidth));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const data = useApplications();
  const today = toNoon(undefined);

  const applications = (data.data ?? [])
    .filter((d) => {
      if (eventFilter === 'with_events') return d.events.length > 0;
      if (eventFilter === 'no_events') return d.events.length === 0;
      return true;
    })
    .sort((a, b) => dayjs(a.date_applied).valueOf() - dayjs(b.date_applied).valueOf());

  const height = margins.top + margins.bottom + applications.length * rowHeight;

  const xMin =
    d3.min(applications, (d) => dayjs(d.date_applied).startOf('day').toDate()) ?? today;

  // Extend past today when events are scheduled in the future
  const maxEventDate = d3.max(
    applications.flatMap((d) => d.events),
    (e) => dayjs(e.date).endOf('day').toDate(),
  );
  const endOfToday = dayjs().endOf('day').toDate();
  const xMax = maxEventDate && maxEventDate > endOfToday ? maxEventDate : endOfToday;

  const xScale = d3
    .scaleTime()
    .domain([xMin, xMax])
    .range([margins.left, width - margins.right]);

  // Keyed by id so two applications to the same company get separate rows
  const yScale = d3
    .scaleBand()
    .domain(applications.map((d) => d.id))
    .range([margins.top, height - margins.bottom])
    .padding(0.3);

  const yAxis = (
    <g>
      <line
        x1={margins.left}
        y1={margins.top}
        x2={margins.left}
        y2={height - margins.bottom}
        stroke={axisColor}
      />
      {applications.map((d) => {
        const yPos = (yScale(d.id) ?? 0) + yScale.bandwidth() / 2;
        return (
          <g key={`${d.id}-ytick`}>
            <text
              x={margins.left - 5}
              y={yPos}
              textAnchor="end"
              fontSize={fontSize}
              dy={3}
              fill={fontColor}
            >
              {d.name}
            </text>
            <line
              x1={margins.left - 5}
              y1={yPos}
              x2={margins.left}
              y2={yPos}
              stroke={axisColor}
            />
          </g>
        );
      })}
    </g>
  );

  const xAxis = (
    <g>
      <line
        x1={margins.left}
        y1={height - margins.bottom}
        x2={width - margins.right}
        y2={height - margins.bottom}
        stroke={axisColor}
      />
      {xScale
        .ticks(Math.max(Math.floor((width - margins.left) / 90), 2))
        // Day grain only: drop sub-day ticks when the range is short
        .filter((t) => t.getHours() === 0)
        .map((t, i) => {
          const xPos = xScale(toNoon(t));
          const yPos = height - margins.bottom;
          return (
            <g key={`${i}-xtick`}>
              <line x1={xPos} y1={yPos} x2={xPos} y2={yPos + 5} stroke={axisColor} />
              <text
                x={xPos}
                y={yPos + 5}
                fontSize={fontSize}
                dy={12}
                textAnchor="middle"
                fill={fontColor}
              >
                {dateFormatter(t)}
              </text>
            </g>
          );
        })}
    </g>
  );

  // Shade each Saturday–Sunday span, clipped to the chart's date range
  const weekendBands = d3.timeSaturday
    .range(d3.timeDay.offset(xMin, -1), xMax)
    .map((saturday) => {
      const x1 = xScale(saturday < xMin ? xMin : saturday);
      const monday = d3.timeDay.offset(saturday, 2);
      const x2 = xScale(monday > xMax ? xMax : monday);
      return { key: saturday.toISOString(), x: x1, width: x2 - x1 };
    })
    .filter((band) => band.width > 0);

  const weekends = (
    <g>
      {weekendBands.map((band) => (
        <rect
          key={band.key}
          x={band.x}
          y={margins.top}
          width={band.width}
          height={height - margins.top - margins.bottom}
          fill={axisColor}
          opacity={0.15}
        />
      ))}
    </g>
  );

  const todayLine = (
    <g>
      <line
        x1={xScale(today)}
        y1={margins.top}
        x2={xScale(today)}
        y2={height - margins.bottom}
        stroke={axisColor}
        strokeDasharray="4 3"
      />
      <text
        x={xScale(today)}
        y={margins.top - 6}
        fontSize={fontSize}
        textAnchor="middle"
        fill={fontColor}
      >
        Today
      </text>
    </g>
  );

  const rows = applications.map((d) => {
    const y = yScale(d.id) ?? 0;
    const start = xScale(toNoon(d.date_applied));
    const end = xScale(getEndDate(d, today));

    return (
      <g key={`${d.id}-row`}>
        {tooltipData?.id === d.id && (
          <rect
            x={margins.left}
            y={y - (yScale.step() - yScale.bandwidth()) / 2}
            height={yScale.step()}
            width={width - margins.left - margins.right}
            fill={'grey'}
            opacity={0.08}
          />
        )}
        <rect
          x={start}
          y={y}
          height={yScale.bandwidth()}
          width={Math.max(end - start, 2)}
          rx={3}
          fill={barColor}
          fillOpacity={isClosed(d) ? 0.15 : 0.3}
        />
        {d.events.map((e, i) => (
          <circle
            key={`${d.id}-event-${i}`}
            cx={xScale(toNoon(e.date))}
            cy={y + yScale.bandwidth() / 2}
            r={5}
            fill={eventTypes[e.type]?.color ?? barColor}
            stroke="white"
            strokeWidth={1.5}
          />
        ))}
        <rect
          x={margins.left}
          y={y}
          height={yScale.bandwidth()}
          width={width - margins.left - margins.right}
          fill={'transparent'}
          style={{ cursor: 'pointer' }}
          onMouseOver={() => {
            setTooltipData(d);
          }}
          onMouseLeave={() => setTooltipData(undefined)}
          onClick={() => {
            setTooltipData(undefined);
            setClickedRow(d);
          }}
        />
      </g>
    );
  });

  const filterControl = (
    <div
      style={{
        display: 'flex',
        gap: '6px',
        fontSize: `${fontSize}px`,
        marginBottom: '10px',
        marginLeft: `${margins.left}px`,
      }}
    >
      {eventFilterOptions.map(({ value, label }) => {
        const selected = eventFilter === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setEventFilter(value)}
            style={{
              padding: '4px 10px',
              borderRadius: '999px',
              border: `1px solid ${selected ? barColor : axisColor}`,
              backgroundColor: selected ? barColor : 'transparent',
              color: selected ? 'white' : fontColor,
              fontSize: `${fontSize}px`,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  const legend = (
    <div
      style={{
        display: 'flex',
        gap: '14px',
        flexWrap: 'wrap',
        fontSize: `${fontSize}px`,
        color: fontColor,
        marginBottom: '6px',
        marginLeft: `${margins.left}px`,
      }}
    >
      {Object.entries(eventTypes).map(([type, { label, color }]) => (
        <div key={type} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <div
            style={{
              height: '10px',
              width: '10px',
              borderRadius: '50%',
              backgroundColor: color,
            }}
          ></div>
          {label}
        </div>
      ))}
    </div>
  );

  let tooltip;
  if (tooltipData) {
    const d = tooltipData;
    const start = xScale(toNoon(d.date_applied));
    const end = xScale(getEndDate(d, today));
    tooltip = (
      <div
        style={{
          position: 'absolute',
          top: `${(yScale(d.id) ?? 0) - 5}px`,
          left: `${start + (end - start) / 2}px`,
          transform: 'translate(-50%, -100%)',
          pointerEvents: 'none',
        }}
      >
        <Card>
          <div style={{ fontWeight: 500 }}>{d.name}</div>
          <div style={{ color: fontColor, marginBottom: '4px' }}>{d.role}</div>
          <div>Applied {dayjs(d.date_applied).format('ddd, MMM D')}</div>
          {d.events.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <div
                style={{
                  height: '8px',
                  width: '8px',
                  borderRadius: '50%',
                  backgroundColor: eventTypes[e.type]?.color ?? barColor,
                }}
              ></div>
              {eventTypes[e.type]?.label ?? e.type} · {dayjs(e.date).format('ddd, MMM D')}
              {e.time && ` · ${formatEventTime(e)}`}
            </div>
          ))}
        </Card>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {clickedRow && (
        <UpdateApplicationModal
          open={!!clickedRow}
          onClose={() => setClickedRow(undefined)}
          data={clickedRow}
        />
      )}
      <Card>
        {filterControl}
        {legend}
        <div ref={containerRef} style={{ position: 'relative' }}>
          <svg height={height} width={width}>
            {weekends}
            {xAxis}
            {todayLine}
            {rows}
            {yAxis}
          </svg>
          {tooltip}
        </div>
      </Card>
    </div>
  );
}
