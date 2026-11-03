import React from 'react';
import dayjs from 'dayjs';
import type { ApplicationEvent, JobApplication } from '../types';
import { closingEventTypes, eventSortKey, eventTypes } from '../eventTypes';
import { UpdateApplicationModal } from './UpdateApplicationModal';
import { useApplications } from '../hooks/useApplications';

const barColor = '#94a3b8';

interface FollowUp {
  application: JobApplication;
  lastEvent: ApplicationEvent;
  daysSince: number;
}

// Applications whose most recent past event isn't an offer or rejection and that have
// nothing scheduled from today on. Events dated today count as upcoming, not past.
const getFollowUps = (applications: JobApplication[]): FollowUp[] => {
  const today = dayjs().format('YYYY-MM-DD');
  const followUps: FollowUp[] = [];

  for (const application of applications) {
    const events = application.events ?? [];
    if (events.some((e) => e.date >= today)) continue;

    const sorted = [...events].sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)));
    const lastEvent = sorted[sorted.length - 1];
    if (!lastEvent || closingEventTypes.includes(lastEvent.type)) continue;

    followUps.push({
      application,
      lastEvent,
      daysSince: dayjs(today).diff(dayjs(lastEvent.date), 'day'),
    });
  }

  // Longest-waiting first
  return followUps.sort((a, b) => b.daysSince - a.daysSince);
};

export function PendingFollowUps() {
  const { data = [] } = useApplications();
  const [clickedRow, setClickedRow] = React.useState<JobApplication>();

  const followUps = getFollowUps(data);

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
        <div className="week-calendar-title">Pending Follow-ups ({followUps.length})</div>
      </div>
      {followUps.length === 0 ? (
        <div className="week-calendar-empty">Nothing to follow up on</div>
      ) : (
        <div className="follow-ups-list">
          {followUps.map(({ application, lastEvent, daysSince }) => (
            <div
              key={application.id}
              className="week-calendar-event"
              style={{ borderLeftColor: eventTypes[lastEvent.type]?.color ?? barColor }}
              onClick={() => setClickedRow(application)}
            >
              <div className="follow-ups-row">
                <div className="week-calendar-event-type">{application.name}</div>
                <div className="follow-ups-days">
                  {daysSince === 1 ? '1 day ago' : `${daysSince} days ago`}
                </div>
              </div>
              <div className="week-calendar-event-role">{application.role}</div>
              <div className="week-calendar-event-time">
                Last: {eventTypes[lastEvent.type]?.label ?? lastEvent.type} on{' '}
                {dayjs(lastEvent.date).format('MMM D')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
