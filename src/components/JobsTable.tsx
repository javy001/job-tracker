import React from 'react';
import type { JobApplication } from '../types';
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
    label: 'Status',
    name: 'status',
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

export function JobsTable() {
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
              ?.sort((a, b) => {
                if (sortColumn === 'date_applied') {
                  let aDate = new Date(a.date_applied ?? '').getTime();
                  let bDate = new Date(b.date_applied ?? '').getTime();
                  return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
                } else if (sortColumn === 'range') {
                  let aVal = a.salary_max ?? 0;
                  let bVal = b.salary_max ?? 0;
                  return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
                } else {
                  let aVal = a[sortColumn as keyof JobApplication] as string;
                  let bVal = b[sortColumn as keyof JobApplication] as string;
                  return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
                }
              })
              .map((d) => {
                return (
                  <tr key={d.id} onClick={() => setClickedRow(d)}>
                    <td>{d.name}</td>
                    <td>{d.role}</td>
                    <td>{new Date(d.date_applied ?? '').toLocaleDateString()}</td>
                    <td>{d.status}</td>
                    <td>{d.location}</td>
                    <td>
                      {d.salary_min?.toLocaleString('en-US')} -{' '}
                      {d.salary_max?.toLocaleString('en-US')}
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
