import React from 'react';
import dayjs from 'dayjs';
import { ChevronLeftIcon, ChevronRightIcon, EyeOffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { eventBlock, eventBlockStyle } from '@/lib/styles';
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
import { Section } from './Section';

const barColor = 'var(--subtle-foreground)';
// Private mode uses the app accent (matching the active Private toggle) so the
// shared availability view still looks lively without revealing event types
const privateColor = 'var(--primary)';

// Private mode hides company, role and event type so the week can be
// screenshotted and shared (e.g. with recruiters) to show availability only
const PRIVATE_STORAGE_KEY = 'weekCalendarPrivate';
const readPrivate = () => {
  try {
    return localStorage.getItem(PRIVATE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

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
      return {
        ...e,
        start,
        end: Math.min(start + eventDuration(e.event), 24 * 60),
        column: 0,
        columns: 1,
      };
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
  const [clicked, setClicked] = React.useState<CalendarEvent>();
  const [isPrivate, setIsPrivate] = React.useState(readPrivate);
  const togglePrivate = () =>
    setIsPrivate((p) => {
      try {
        localStorage.setItem(PRIVATE_STORAGE_KEY, String(!p));
      } catch {
        // storage unavailable; the toggle still works for this session
      }
      return !p;
    });

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
    }),
  );
  const allPlaced = [...placedByDate.values()].flat();
  const gridStart =
    Math.floor(Math.min(DAY_START, ...allPlaced.map((e) => e.start)) / 60) * 60;
  const gridEnd = Math.ceil(Math.max(DAY_END, ...allPlaced.map((e) => e.end)) / 60) * 60;
  const hours = Array.from(
    { length: (gridEnd - gridStart) / 60 },
    (_, i) => gridStart / 60 + i,
  );
  const gridHeight = (gridEnd - gridStart) * pxPerMinute;

  const weekLabel = `${monday.format('MMM D')} – ${days[4].format('MMM D, YYYY')}`;

  const eventColor = (event: ApplicationEvent) =>
    isPrivate ? privateColor : (eventTypes[event.type]?.color ?? barColor);

  const renderEventBody = ({ application, event }: CalendarEvent, showTime: boolean) =>
    isPrivate ? (
      <>
        <div className="font-medium">Busy</div>
        {showTime && event.time && (
          <div className="text-muted-foreground">
            {formatEventTime(event)} · {formatDuration(eventDuration(event))}
          </div>
        )}
      </>
    ) : (
      <>
        <div className="truncate font-medium">{application.name}</div>
        {showTime && event.time && (
          <div className="text-muted-foreground">
            {formatEventTime(event)} · {formatDuration(eventDuration(event))}
          </div>
        )}
        <div className="truncate">{eventTypes[event.type]?.label ?? event.type}</div>
        <div className="truncate text-subtle-foreground">{application.role}</div>
      </>
    );

  const actions = (
    <>
      <Button
        variant={isPrivate ? 'secondary' : 'ghost'}
        aria-pressed={isPrivate}
        title="Hide company, role and event details so the calendar can be shared"
        onClick={togglePrivate}
        className={cn(isPrivate && 'text-primary dark:text-[#9db2ff]')}
      >
        <EyeOffIcon />
        Private
      </Button>
      <CalendarInvitesButton />
      <Button variant="ghost" onClick={() => setMonday(getDefaultMonday())}>
        This week
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous week"
        onClick={() => setMonday((m) => m.subtract(1, 'week'))}
      >
        <ChevronLeftIcon />
      </Button>
      <span className="min-w-[170px] text-center text-[13px] font-medium tabular-nums">
        {weekLabel}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next week"
        onClick={() => setMonday((m) => m.add(1, 'week'))}
      >
        <ChevronRightIcon />
      </Button>
    </>
  );

  return (
    <Section title="Upcoming events" actions={actions}>
      {clicked && (
        <UpdateApplicationModal
          open
          onClose={() => setClicked(undefined)}
          data={clicked.application}
          focusEvent={clicked.event}
        />
      )}
      <div className="grid grid-cols-[44px_repeat(5,minmax(0,1fr))] gap-x-2 gap-y-1">
        <div />
        {days.map((day) => {
          const key = day.format('YYYY-MM-DD');
          const isToday = key === today;
          // Untimed events don't block any time, so private mode leaves them out
          const untimed = isPrivate
            ? []
            : (eventsByDate.get(key) ?? []).filter(({ event }) => !event.time);
          return (
            <div
              key={key}
              className={cn(
                'flex flex-col gap-1.5 rounded-md bg-muted px-2 py-1.5',
                isToday && 'bg-primary/15 ring-1 ring-primary/50 ring-inset',
              )}
            >
              <div
                className={cn(
                  'text-xs font-medium text-muted-foreground',
                  isToday && 'text-primary dark:text-[#9db2ff]',
                )}
              >
                {day.format('ddd, MMM D')}
              </div>
              {untimed.map((e, i) => (
                <div
                  key={i}
                  className={eventBlock}
                  style={eventBlockStyle(eventColor(e.event))}
                  onClick={() => setClicked(e)}
                >
                  {renderEventBody(e, false)}
                </div>
              ))}
            </div>
          );
        })}

        <div className="relative" style={{ height: gridHeight }}>
          {hours.map((h, i) => (
            <div
              key={h}
              className={cn(
                'absolute right-0 text-[11px] whitespace-nowrap text-subtle-foreground tabular-nums',
                i > 0 && '-translate-y-1/2',
              )}
              style={{ top: (h * 60 - gridStart) * pxPerMinute }}
            >
              {dayjs().hour(h).minute(0).format('h A')}
            </div>
          ))}
        </div>
        {days.map((day) => {
          const key = day.format('YYYY-MM-DD');
          const isToday = key === today;
          return (
            <div
              key={key}
              className={cn(
                'relative overflow-hidden rounded-md bg-muted bg-[linear-gradient(to_bottom,var(--border-strong)_1px,transparent_1px)]',
                isToday && 'bg-primary/10 ring-1 ring-primary/50 ring-inset',
              )}
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
                    className={cn(eventBlock, 'absolute box-border overflow-hidden px-1.5 py-1 leading-tight')}
                    title={
                      isPrivate
                        ? `Busy · ${formatEventTime(e.event)} · ${formatDuration(eventDuration(e.event))}`
                        : `${eventTypes[e.event.type]?.label ?? e.event.type} · ${formatEventTime(e.event)} · ${formatDuration(eventDuration(e.event))}\n${e.application.name ?? ''}`
                    }
                    style={{
                      ...eventBlockStyle(eventColor(e.event)),
                      top: (e.start - gridStart) * pxPerMinute,
                      height,
                      left: `calc(${(e.column / e.columns) * 100}% + 2px)`,
                      width: `calc(${100 / e.columns}% - 4px)`,
                    }}
                    onClick={() => setClicked({ application: e.application, event: e.event })}
                  >
                    {renderEventBody(e, true)}
                  </div>
                );
              })}
              {isToday && nowMinutes >= gridStart && nowMinutes <= gridEnd && (
                <div
                  className="pointer-events-none absolute right-0 left-0 z-[1] h-0.5 bg-now before:absolute before:-top-[3px] before:-left-px before:size-2 before:rounded-full before:bg-now"
                  style={{ top: (nowMinutes - gridStart) * pxPerMinute }}
                  aria-label={`Current time ${now.format('h:mm A')}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
