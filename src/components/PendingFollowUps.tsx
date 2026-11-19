import React from 'react';
import dayjs from 'dayjs';
import type { ApplicationEvent, JobApplication } from '../types';
import { closingEventTypes, eventSortKey, eventTypes } from '../eventTypes';
import { UpdateApplicationModal } from './UpdateApplicationModal';
import { useApplications } from '../hooks/useApplications';
import { eventBlock, eventBlockStyle } from '@/lib/styles';
import { Section } from './Section';

const barColor = 'var(--subtle-foreground)';

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
    <Section
      title={
        <>
          Pending follow-ups{' '}
          <span className="font-normal text-subtle-foreground tabular-nums">{followUps.length}</span>
        </>
      }
    >
      {clickedRow && (
        <UpdateApplicationModal
          open={!!clickedRow}
          onClose={() => setClickedRow(undefined)}
          data={clickedRow}
        />
      )}
      {followUps.length === 0 ? (
        <div className="text-[13px] text-subtle-foreground">Nothing to follow up on</div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2">
          {followUps.map(({ application, lastEvent, daysSince }) => (
            <div
              key={application.id}
              className={eventBlock}
              style={eventBlockStyle(eventTypes[lastEvent.type]?.color ?? barColor)}
              onClick={() => setClickedRow(application)}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="truncate font-medium">{application.name}</div>
                <div className="whitespace-nowrap text-muted-foreground tabular-nums">
                  {daysSince === 1 ? '1 day ago' : `${daysSince} days ago`}
                </div>
              </div>
              <div className="truncate text-subtle-foreground">{application.role}</div>
              <div className="text-muted-foreground">
                Last: {eventTypes[lastEvent.type]?.label ?? lastEvent.type} on{' '}
                {dayjs(lastEvent.date).format('MMM D')}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
