import React from 'react';
import dayjs from 'dayjs';
import type { ApplicationEvent, JobApplication } from '../types';
import { eventTypes } from '../eventTypes';
import { UpdateApplicationModal } from './UpdateApplicationModal';
import { useApplications } from '../hooks/useApplications';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

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
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              {columns.map((c) => {
                return (
                  <th
                    key={c.label}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (sortDirection === 'asc') {
                        setSortDirection('desc');
                      } else {
                        setSortDirection('asc');
                      }
                      setSortColumn(c.name);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div>{c.label}</div>
                      {sortColumn === c.name && sortDirection === 'asc' && (
                        <ArrowUpwardIcon />
                      )}
                      {sortColumn === c.name && sortDirection === 'desc' && (
                        <ArrowDownwardIcon />
                      )}
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
                  <tr key={d.id} onClick={() => setClickedRow(d)}>
                    <td>{d.name}</td>
                    <td>{d.role}</td>
                    <td>{d.date_applied ? dayjs(d.date_applied).format('M/D/YYYY') : '—'}</td>
                    <td>{sourceLabels[d.source ?? ''] ?? '—'}</td>
                    <td>
                      {latestEvent
                        ? `${latestEventLabel(d)} · ${dayjs(latestEvent.date).format('MMM D')}`
                        : '—'}
                    </td>
                    <td>{d.location}</td>
                    <td>
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
    </>
  );
}
