import React from 'react';
import dayjs from 'dayjs';
import type { ApplicationEvent, JobApplication } from '../types';
import { eventTypes } from '../eventTypes';
import { UpdateApplicationModal } from './UpdateApplicationModal';
import { useApplications } from '../hooks/useApplications';
import { ArrowDownIcon, ArrowUpIcon, XIcon } from 'lucide-react';
import { Section } from './Section';
import { Button } from './ui/button';
import { ColumnFilter, type FilterOption } from './ColumnFilter';

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

// How a column is filtered: the options to offer and whether a row matches one
interface ColumnFilterDef {
  multiple?: boolean;
  searchable?: boolean;
  options: (rows: JobApplication[]) => FilterOption[];
  matches: (d: JobApplication, value: string) => boolean;
}

const BLANK = '__blank__';

// Pick-from-list filter over a column's distinct text values
const distinctValues = (get: (d: JobApplication) => string | null): ColumnFilterDef => ({
  multiple: true,
  searchable: true,
  options: (rows) => {
    const values = [...new Set(rows.map((d) => get(d)?.trim() || BLANK))].sort((a, b) =>
      a === BLANK ? 1 : b === BLANK ? -1 : a.localeCompare(b),
    );
    return values.map((v) => ({ value: v, label: v === BLANK ? '(Blank)' : v }));
  },
  matches: (d, value) => (get(d)?.trim() || BLANK) === value,
});

const salaryThresholds = [50_000, 100_000, 150_000, 200_000, 250_000, 300_000];

const columnFilters: Record<string, ColumnFilterDef> = {
  name: distinctValues((d) => d.name),
  role: distinctValues((d) => d.role),
  date_applied: {
    options: () => [
      { value: '7', label: 'Last 7 days' },
      { value: '30', label: 'Last 30 days' },
      { value: '90', label: 'Last 90 days' },
      { value: BLANK, label: 'No date' },
    ],
    matches: (d, value) => {
      if (value === BLANK) return !d.date_applied;
      const cutoff = dayjs().subtract(Number(value), 'day').startOf('day');
      return !!d.date_applied && !dayjs(d.date_applied).isBefore(cutoff);
    },
  },
  source: {
    multiple: true,
    options: () => [
      ...Object.entries(sourceLabels).map(([value, label]) => ({ value, label })),
      { value: BLANK, label: 'Not set' },
    ],
    matches: (d, value) => (d.source ?? BLANK) === value,
  },
  latest_event: {
    multiple: true,
    options: () => [
      ...Object.entries(eventTypes).map(([value, { label }]) => ({ value, label })),
      { value: BLANK, label: 'No events' },
    ],
    matches: (d, value) => (getLatestEvent(d)?.type ?? BLANK) === value,
  },
  location: distinctValues((d) => d.location),
  range: {
    options: () => [
      ...salaryThresholds.map((t) => ({
        value: String(t),
        label: `${(t / 1000).toLocaleString('en-US')}k+`,
      })),
      { value: BLANK, label: 'No range' },
    ],
    // A threshold keeps rows whose range reaches it
    matches: (d, value) => {
      const top = d.salary_max ?? d.salary_min;
      if (value === BLANK) return top == null;
      return top != null && Number(top) >= Number(value);
    },
  },
};

// Selected option values per column; a column with none selected isn't filtered
type Filters = Record<string, string[]>;

// A row must match every filtered column, and any selected option within a column
const matchesFilters = (d: JobApplication, filters: Filters) =>
  Object.entries(filters).every(
    ([col, values]) => !values.length || values.some((v) => columnFilters[col].matches(d, v)),
  );

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
  const [filters, setFilters] = React.useState<Filters>({});
  const hasFilters = Object.values(filters).some((v) => v.length > 0);

  const data = useApplications();
  // Rows the metric-card filter allows; column filter options are drawn from these
  const rows = React.useMemo(
    () => data.data?.filter((d) => !filter || filter(d)) ?? [],
    [data.data, filter],
  );

  return (
    <>
      {clickedRow && (
        <UpdateApplicationModal
          open={!!clickedRow}
          onClose={() => setClickedRow(undefined)}
          data={clickedRow}
        />
      )}
      <Section
        title="Applications"
        bodyClassName="p-0"
        actions={
          hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
              <XIcon />
              Clear filters
            </Button>
          )
        }
      >
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
                      {columnFilters[c.name] && (
                        <ColumnFilter
                          label={c.label}
                          options={columnFilters[c.name].options(rows)}
                          multiple={columnFilters[c.name].multiple}
                          searchable={columnFilters[c.name].searchable}
                          selected={filters[c.name] ?? []}
                          onChange={(selected) => setFilters((f) => ({ ...f, [c.name]: selected }))}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows
              .filter((d) => matchesFilters(d, filters))
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
