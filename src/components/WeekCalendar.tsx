import React from 'react';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { ApplicationEvent, JobApplication } from '../types';
import {
  eventDuration,
  eventSortKey,
  eventTypes,
  formatDuration,
  formatEventTime,
} from '../eventTypes';
import { UpdateApplicationModal } from './UpdateApplicationModal';
import { CalendarInvitesButton } from './CalendarInvites';
import { useApplications } from '../hooks/useApplications';

const barColor = '#94a3b8';

// Monday of the week containing the given date (Sunday belongs to the week before it)
const getMonday = (date: dayjs.Dayjs) =>
  date.startOf('day').subtract((date.day() + 6) % 7, 'day');

// On weekends, start on the upcoming workweek since the current one is over
const getDefaultMonday = () => {
  const today = dayjs();
  const isWeekend = today.day() === 0 || today.day() === 6;
  return getMonday(today).add(isWeekend ? 1 : 0, 'week');
};

interface CalendarEvent {
  application: JobApplication;
  event: ApplicationEvent;
}

// A timed event placed on the grid: start/end in minutes since midnight,
// plus which side-by-side column it occupies among events it overlaps
interface PlacedEvent extends CalendarEvent {
  start: number;
  end: number;
  column: number;
  columns: number;
}

const DAY_START = 9 * 60; // the grid always covers at least 9:00 AM
const DAY_END = 17 * 60; // ...through 5:00 PM
const PX_PER_HOUR = 65;
const pxPerMinute = PX_PER_HOUR / 60;

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// Lay out a day's timed events so overlapping ones sit side by side.
// Events that chain-overlap form a cluster; each cluster shares a column count.
const layoutDay = (events: CalendarEvent[]): PlacedEvent[] => {
  const timed = events
    .filter(({ event }) => event.time)
    .map((e) => {
      const start = toMinutes(e.event.time!);
      return { ...e, start, end: Math.min(start + eventDuration(e.event), 24 * 60), column: 0, columns: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  let cluster: PlacedEvent[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;
  const closeCluster = () => {
    for (const e of cluster) e.columns = columnEnds.length;
    cluster = [];
    columnEnds = [];
  };

  for (const e of timed) {
    if (e.start >= clusterEnd) closeCluster();
    const free = columnEnds.findIndex((end) => end <= e.start);
    e.column = free === -1 ? columnEnds.length : free;
    columnEnds[e.column] = e.end;
    clusterEnd = Math.max(clusterEnd, e.end);
    cluster.push(e);
  }
  closeCluster();
  return timed;
};

export function WeekCalendar() {
  const { data = [] } = useApplications();
  const [monday, setMonday] = React.useState(getDefaultMonday);
  const [clickedRow, setClickedRow] = React.useState<JobApplication>();

  const days = Array.from({ length: 5 }, (_, i) => monday.add(i, 'day'));
  const today = dayjs().format('YYYY-MM-DD');

  // Re-render every minute so the current-time line keeps moving
  const [now, setNow] = React.useState(dayjs);
  React.useEffect(() => {
    const id = setInterval(() => setNow(dayjs()), 60_000);
    return () => clearInterval(id);
  }, []);
  const nowMinutes = now.hour() * 60 + now.minute();

  // Group every event by its YYYY-MM-DD date, leaving out rejections
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const application of data) {
    for (const event of application.events) {
      if (event.type === 'rejected') continue;
      const key = dayjs(event.date).format('YYYY-MM-DD');
      eventsByDate.set(key, [...(eventsByDate.get(key) ?? []), { application, event }]);
    }
  }

  // Within each day, list events in time-of-day order (untimed events first)
  for (const events of eventsByDate.values()) {
    events.sort((a, b) => eventSortKey(a.event).localeCompare(eventSortKey(b.event)));
  }

  // Grid spans 9 AM–5 PM, stretched to fit any earlier or later event this week
  const placedByDate = new Map(
    days.map((day) => {
      const key = day.format('YYYY-MM-DD');
      return [key, layoutDay(eventsByDate.get(key) ?? [])];
    })
  );
  const allPlaced = [...placedByDate.values()].flat();
  const gridStart =
    Math.floor(Math.min(DAY_START, ...allPlaced.map((e) => e.start)) / 60) * 60;
  const gridEnd = Math.ceil(Math.max(DAY_END, ...allPlaced.map((e) => e.end)) / 60) * 60;
  const hours = Array.from(
    { length: (gridEnd - gridStart) / 60 },
    (_, i) => gridStart / 60 + i
  );
  const gridHeight = (gridEnd - gridStart) * pxPerMinute;

  const weekLabel = `${monday.format('MMM D')} – ${days[4].format('MMM D, YYYY')}`;

  const renderEventBody = ({ application, event }: CalendarEvent, showTime: boolean) => (
    <>
      <div className="week-calendar-event-type">{application.name}</div>
      {showTime && event.time && (
        <div className="week-calendar-event-time">
          {formatEventTime(event)} · {formatDuration(eventDuration(event))}
        </div>
      )}
      <div>{eventTypes[event.type]?.label ?? event.type}</div>
      <div className="week-calendar-event-role">{application.role}</div>
    </>
  );

  return (
    <div className="week-calendar">
      {clickedRow && (
        <UpdateApplicationModal
          open={!!clickedRow}
          onClose={() => setClickedRow(undefined)}
          data={clickedRow}
        />
      )}
      <div className="week-calendar-header">
        <div className="week-calendar-title">Upcoming Events</div>
        <div className="week-calendar-nav">
          <CalendarInvitesButton />
          <Button size="small" onClick={() => setMonday(getDefaultMonday())}>
            This week
          </Button>
          <IconButton
            size="small"
            aria-label="Previous week"
            onClick={() => setMonday((m) => m.subtract(1, 'week'))}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
          <span className="week-calendar-range">{weekLabel}</span>
          <IconButton
            size="small"
            aria-label="Next week"
            onClick={() => setMonday((m) => m.add(1, 'week'))}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        </div>
      </div>
      <div className="week-calendar-days">
        <div />
        {days.map((day) => {
          const key = day.format('YYYY-MM-DD');
          const untimed = (eventsByDate.get(key) ?? []).filter(({ event }) => !event.time);
          return (
            <div
              key={key}
              className={`week-calendar-day-head${key === today ? ' week-calendar-today' : ''}`}
            >
              <div className="week-calendar-day-label">{day.format('ddd, MMM D')}</div>
              {untimed.map((e, i) => (
                <div
                  key={i}
                  className="week-calendar-event"
                  style={{ borderLeftColor: eventTypes[e.event.type]?.color ?? barColor }}
                  onClick={() => setClickedRow(e.application)}
                >
                  {renderEventBody(e, false)}
                </div>
              ))}
            </div>
          );
        })}

        <div className="week-calendar-hours" style={{ height: gridHeight }}>
          {hours.map((h) => (
            <div
              key={h}
              className="week-calendar-hour-label"
              style={{ top: (h * 60 - gridStart) * pxPerMinute }}
            >
              {dayjs().hour(h).minute(0).format('h A')}
            </div>
          ))}
        </div>
        {days.map((day) => {
          const key = day.format('YYYY-MM-DD');
          return (
            <div
              key={key}
              className={`week-calendar-day${key === today ? ' week-calendar-today' : ''}`}
              style={{
                height: gridHeight,
                backgroundSize: `100% ${PX_PER_HOUR}px`,
              }}
            >
              {(placedByDate.get(key) ?? []).map((e, i) => {
                const height = (e.end - e.start) * pxPerMinute;
                return (
                  <div
                    key={i}
                    className="week-calendar-event week-calendar-event-timed"
                    title={`${eventTypes[e.event.type]?.label ?? e.event.type} · ${formatEventTime(e.event)} · ${formatDuration(eventDuration(e.event))}\n${e.application.name ?? ''}`}
                    style={{
                      borderLeftColor: eventTypes[e.event.type]?.color ?? barColor,
                      top: (e.start - gridStart) * pxPerMinute,
                      height,
                      left: `calc(${(e.column / e.columns) * 100}% + 2px)`,
                      width: `calc(${100 / e.columns}% - 4px)`,
                    }}
                    onClick={() => setClickedRow(e.application)}
                  >
                    {renderEventBody(e, true)}
                  </div>
                );
              })}
              {key === today && nowMinutes >= gridStart && nowMinutes <= gridEnd && (
                <div
                  className="week-calendar-now"
                  style={{ top: (nowMinutes - gridStart) * pxPerMinute }}
                  aria-label={`Current time ${now.format('h:mm A')}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
