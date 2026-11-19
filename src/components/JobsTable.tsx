import React from 'react';
import dayjs from 'dayjs';
import type { ApplicationEvent, JobApplication } from '../types';
import { eventTypes } from '../eventTypes';
import { UpdateApplicationModal } from './UpdateApplicationModal';
import { useApplications } from '../hooks/useApplications';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import { Section } from './Section';

const columns: { label: string; name: keyof JobApplication | string }[] = [
  {
    label: 'Company',
    name: 'name',
  },
  {
    label: 'Role',
    name: 'role',
  },
  {
    label: 'Date Applied',
    name: 'date_applied',
  },
  {
    label: 'Source',
    name: 'source',
  },
  {
    label: 'Latest Event',
    name: 'latest_event',
  },
  {
    label: 'Location',
    name: 'location',
  },
  {
    label: 'Range',
    name: 'range',
  },
];

const sourceLabels: Record<string, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound',
};

// The event with the latest date, or undefined if none are scheduled
const getLatestEvent = (d: JobApplication): ApplicationEvent | undefined =>
  d.events.reduce<ApplicationEvent | undefined>(
    (latest, e) => (!latest || e.date > latest.date ? e : latest),
    undefined,
  );

const latestEventLabel = (d: JobApplication): string => {
  const e = getLatestEvent(d);
  return e ? (eventTypes[e.type]?.label ?? e.type) : '';
};

export function JobsTable({
  filter,
}: {
  filter?: (d: JobApplication) => boolean;
}) {
  const [clickedRow, setClickedRow] = React.useState<JobApplication>();
  const [sortColumn, setSortColumn] = React.useState<keyof JobApplication | string>(
    'name',
  );
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  const data = useApplications();

  return (
    <>
      {clickedRow && (
        <UpdateApplicationModal
          open={!!clickedRow}
          onClose={() => setClickedRow(undefined)}
          data={clickedRow}
        />
      )}
      <Section title="Applications" bodyClassName="p-0">
        <div className="relative max-h-[500px] overflow-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="sticky top-0 z-[1] bg-card shadow-[inset_0_-1px_0_var(--border)]">
              {columns.map((c) => {
                const sorted = sortColumn === c.name;
                return (
                  <th
                    key={c.label}
                    aria-sort={sorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : undefined}
                    className="h-9 cursor-pointer px-4 text-xs font-medium whitespace-nowrap text-muted-foreground select-none hover:text-foreground"
                    onClick={() => {
                      if (sortDirection === 'asc') {
                        setSortDirection('desc');
                      } else {
                        setSortDirection('asc');
                      }
                      setSortColumn(c.name);
                    }}
                  >
                    <div className="flex items-center gap-1">
                      <div>{c.label}</div>
                      {sorted && sortDirection === 'asc' && <ArrowUpIcon className="size-3" />}
                      {sorted && sortDirection === 'desc' && <ArrowDownIcon className="size-3" />}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.data
              ?.filter((d) => !filter || filter(d))
              .sort((a, b) => {
                if (sortColumn === 'date_applied') {
                  let aDate = new Date(a.date_applied ?? '').getTime();
                  let bDate = new Date(b.date_applied ?? '').getTime();
                  return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
                } else if (sortColumn === 'range') {
                  let aVal = a.salary_max ?? 0;
                  let bVal = b.salary_max ?? 0;
                  return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                } else if (sortColumn === 'latest_event') {
                  let aVal = getLatestEvent(a)?.date ?? '';
                  let bVal = getLatestEvent(b)?.date ?? '';
                  return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
                } else {
                  let aVal = (a[sortColumn as keyof JobApplication] as string) ?? '';
                  let bVal = (b[sortColumn as keyof JobApplication] as string) ?? '';
                  return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
                }
              })
              .map((d) => {
                const latestEvent = getLatestEvent(d);
                return (
                  <tr
                    key={d.id}
                    className="h-9 cursor-pointer border-b transition-colors last:border-b-0 hover:bg-accent/60 [&>td]:px-4"
                    onClick={() => setClickedRow(d)}
                  >
                    <td className="font-medium">{d.name}</td>
                    <td className="text-muted-foreground">{d.role}</td>
                    <td className="whitespace-nowrap tabular-nums">{d.date_applied ? dayjs(d.date_applied).format('M/D/YYYY') : '—'}</td>
                    <td>{sourceLabels[d.source ?? ''] ?? '—'}</td>
                    <td className="whitespace-nowrap">
                      {latestEvent
                        ? `${latestEventLabel(d)} · ${dayjs(latestEvent.date).format('MMM D')}`
                        : '—'}
                    </td>
                    <td className="text-muted-foreground">{d.location}</td>
                    <td className="whitespace-nowrap tabular-nums">
                      {d.salary_min == null && d.salary_max == null
                        ? '—'
                        : [d.salary_min, d.salary_max]
                            .map((v) => (v == null ? '?' : Number(v).toLocaleString('en-US')))
                            .join(' - ')}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
        </div>
      </Section>
    </>
  );
}
