import React from 'react';
import { Card } from './Card';
import { useApplications } from '../hooks/useApplications';
import type { JobApplication } from '../types';
import * as d3 from 'd3';

const height = 500;
const width = 900;
const margins = { top: 20, bottom: 30, left: 280, right: 20 };
const fontSize = 12;

const axisColor = '#b8b8b8';
const fontColor = '#808080';

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short', // or 'long'
});

export function SalaryRangeChart() {
  const [tooltipData, setTooltipData] = React.useState<JobApplication>();

  const data = useApplications();
  const xMin = d3.min(data.data?.map((d) => d.salary_min ?? 0) ?? [0]) ?? 0;
  const xMax = d3.max(data.data?.map((d) => d.salary_max ?? 0) ?? [0]) ?? 0;

  const xScale = d3.scaleLinear(
    [xMin * 0.95, xMax * 1.05],
    [margins.left, width - margins.right],
  );

  const yScale = d3
    .scaleBand()
    .domain(
      data.data
        ?.sort((a, b) => {
          return (a.name ?? '').localeCompare(b.name ?? '');
        })
        .map((d) => d.role ?? '--') ?? [],
    )
    .range([margins.top, height - margins.bottom])
    .padding(0.1);

  const colorScale = d3
    .scaleOrdinal()
    .domain(d3.union(data.data?.map((d) => d.name ?? '-') ?? []))
    .range(d3.schemeCategory10);

  const yAxis = (
    <g>
      <line
        x1={margins.left}
        y1={margins.top}
        x2={margins.left}
        y2={height - margins.bottom}
        stroke={axisColor}
      />
      {yScale.domain().map((d, i) => {
        const yPos = (yScale(d) ?? 0) + yScale.bandwidth() / 2;
        return (
          <g key={`${i}-ytick`}>
            <text
              x={margins.left - 5}
              y={yPos}
              textAnchor="end"
              fontSize={fontSize}
              dy={3}
              fill={fontColor}
            >
              {d}
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
      {xScale.ticks().map((t, i) => {
        const xPos = xScale(t);
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
              {compactFormatter.format(t)}
            </text>
          </g>
        );
      })}
    </g>
  );

  const points = data.data?.map((d) => {
    return (
      <g key={`${d.id}-bar`}>
        <rect
          x={xScale(d.salary_min ?? 0)}
          y={yScale(d.role ?? '')}
          height={yScale.bandwidth()}
          width={xScale(d.salary_max ?? 0) - xScale(d.salary_min ?? 0)}
          stroke={colorScale(d.name ?? '-') as string}
          fill={colorScale(d.name ?? '-') as string}
          fillOpacity={0.2}
        />
        {tooltipData?.id === d.id && (
          <g>
            <rect
              x={margins.left}
              y={yScale(d.role ?? '')}
              height={yScale.bandwidth()}
              width={width - margins.left - margins.right}
              fill={'grey'}
              opacity={0.08}
            />
            <line
              x1={margins.left}
              y1={(yScale(d.role ?? '') ?? 0) + yScale.bandwidth()}
              x2={width - margins.right}
              y2={(yScale(d.role ?? '') ?? 0) + yScale.bandwidth()}
              stroke={'grey'}
              strokeWidth={2}
              opacity={0.2}
            />
            <line
              x1={margins.left}
              y1={yScale(d.role ?? '') ?? 0}
              x2={width - margins.right}
              y2={yScale(d.role ?? '') ?? 0}
              stroke={'grey'}
              strokeWidth={2}
              opacity={0.2}
            />
          </g>
        )}
        <rect
          x={margins.left}
          y={yScale(d.role ?? '')}
          height={yScale.bandwidth()}
          width={width - margins.left - margins.right}
          fill={'transparent'}
          onMouseOver={() => {
            setTooltipData(d);
          }}
          onMouseLeave={() => setTooltipData(undefined)}
        />
      </g>
    );
  });

  let tooltip;
  if (tooltipData) {
    const d = tooltipData;
    const left = xScale(d.salary_min ?? 0) ?? 0;
    const right = xScale(d.salary_max ?? 0) ?? 0;
    tooltip = (
      <div
        style={{
          position: 'absolute',
          top: `${(yScale(d.role ?? '') ?? 0) - 5}px`,
          left: `${left + (right - left) / 2}px`,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <Card>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div
              style={{
                height: '10px',
                width: '10px',
                borderRadius: '50%',
                backgroundColor: `${colorScale(d.name ?? '')}`,
              }}
            ></div>
            <div>{d.name}</div>
          </div>

          <div>
            {compactFormatter.format(d.salary_min ?? 0)} -{' '}
            {compactFormatter.format(d.salary_max ?? 0)}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ width: 'fit-content' }}>
      <Card>
        <div style={{ position: 'relative' }}>
          <svg height={height} width={width}>
            {yAxis}
            {xAxis}
            {points}
          </svg>
          {tooltip}
        </div>
      </Card>
    </div>
  );
}
