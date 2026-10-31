import React from 'react';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { ApplicationEvent, JobApplication } from '../types';
import { eventSortKey, eventTypes, formatEventTime } from '../eventTypes';
import { UpdateApplicationModal } from './UpdateApplicationModal';
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

export function WeekCalendar() {
  const { data = [] } = useApplications();
  const [monday, setMonday] = React.useState(getDefaultMonday);
  const [clickedRow, setClickedRow] = React.useState<JobApplication>();

  const days = Array.from({ length: 5 }, (_, i) => monday.add(i, 'day'));
  const today = dayjs().format('YYYY-MM-DD');

  // Group every event by its YYYY-MM-DD date
  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const application of data) {
    for (const event of application.events) {
      const key = dayjs(event.date).format('YYYY-MM-DD');
      eventsByDate.set(key, [...(eventsByDate.get(key) ?? []), { application, event }]);
    }
  }

  // Within each day, list events in time-of-day order (untimed events first)
  for (const events of eventsByDate.values()) {
    events.sort((a, b) => eventSortKey(a.event).localeCompare(eventSortKey(b.event)));
  }

  const weekLabel = `${monday.format('MMM D')} – ${days[4].format('MMM D, YYYY')}`;

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
        {days.map((day) => {
          const key = day.format('YYYY-MM-DD');
          const events = eventsByDate.get(key) ?? [];
          return (
            <div
              key={key}
              className={`week-calendar-day${key === today ? ' week-calendar-today' : ''}`}
            >
              <div className="week-calendar-day-label">{day.format('ddd, MMM D')}</div>
              {events.length === 0 && <div className="week-calendar-empty">No events</div>}
              {events.map(({ application, event }, i) => (
                <div
                  key={i}
                  className="week-calendar-event"
                  style={{ borderLeftColor: eventTypes[event.type]?.color ?? barColor }}
                  onClick={() => setClickedRow(application)}
                >
                  <div className="week-calendar-event-type">
                    {eventTypes[event.type]?.label ?? event.type}
                  </div>
                  {event.time && (
                    <div className="week-calendar-event-time">{formatEventTime(event)}</div>
                  )}
                  <div>{application.name}</div>
                  <div className="week-calendar-event-role">{application.role}</div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
