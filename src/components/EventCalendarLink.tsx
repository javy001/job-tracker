import React from 'react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import type { ApplicationEvent, CalendarInvite } from '../types';
import { formatSlot } from '../eventTypes';
import { useCalendarInvites } from '../hooks/useCalendarInvites';

interface Props {
  event: ApplicationEvent;
  // Invite uids linked to other events in this form; not offered here
  takenUids: Set<string>;
  // Invite uids linked to this application when the form opened. If the user
  // unlinks one in this form it's free again, though the server still lists
  // it as linked until saved.
  ownUids: Set<string>;
  onChange: (changes: Partial<ApplicationEvent>) => void;
}

// Shows which calendar invite an event is linked to, with Change / Unlink,
// or a Link button for an unlinked event. Edits only the form state; they're
// saved with the rest of the application.
export function EventCalendarLink({ event, takenUids, ownUids, onChange }: Props) {
  const { data } = useCalendarInvites();
  const [picking, setPicking] = React.useState(false);

  if (!data?.configured) {
    // Without a feed there's nothing to link to, but still allow unlinking
    if (!event.calendar_uid) return null;
  }

  const linked = event.calendar_uid
    ? data?.linked.find((i) => i.uid === event.calendar_uid)
    : undefined;

  const candidates: CalendarInvite[] = [
    ...(data?.invites ?? []),
    ...(data?.ignored ?? []),
    ...(data?.linked ?? []).filter((i) => !i.cancelled && ownUids.has(i.uid)),
  ].filter((i) => i.uid !== event.calendar_uid && !takenUids.has(i.uid));

  const unlink = () => onChange({ calendar_uid: undefined, calendar_ack: undefined });

  const link = (uid: string) => {
    const invite = candidates.find((i) => i.uid === uid);
    if (!invite) return;
    // Take the invite's time so the event isn't immediately flagged as rescheduled
    onChange({
      calendar_uid: invite.uid,
      calendar_ack: undefined,
      date: invite.date,
      time: invite.time,
      duration: invite.duration,
    });
    setPicking(false);
  };

  if (picking) {
    return (
      <div className="event-calendar-link">
        <TextField
          select
          size="small"
          label="Calendar invite"
          value=""
          onChange={(ev) => link(ev.target.value)}
          style={{ flex: 1 }}
          slotProps={{ select: { defaultOpen: true } }}
        >
          {candidates.length === 0 && (
            <MenuItem value="" disabled>
              No other invites available
            </MenuItem>
          )}
          {candidates.map((i) => (
            <MenuItem key={i.uid} value={i.uid}>
              {i.title} · {formatSlot(i)}
            </MenuItem>
          ))}
        </TextField>
        <IconButton size="small" aria-label="Cancel" onClick={() => setPicking(false)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
    );
  }

  if (!event.calendar_uid) {
    return (
      <div className="event-calendar-link">
        <Button
          size="small"
          startIcon={<EventAvailableIcon fontSize="small" />}
          onClick={() => setPicking(true)}
        >
          Link calendar invite
        </Button>
      </div>
    );
  }

  const cancelled = linked?.cancelled;
  const description = linked
    ? `${linked.title} · ${formatSlot(linked)}${cancelled ? ' (cancelled)' : ''}`
    : data
      ? 'Linked invite is no longer in the calendar feed'
      : 'Linked to a calendar invite';

  return (
    <div className={`event-calendar-link linked${cancelled ? ' cancelled' : ''}`}>
      {cancelled ? <EventBusyIcon fontSize="small" /> : <EventAvailableIcon fontSize="small" />}
      <Tooltip title={description}>
        <span className="event-calendar-link-text">{description}</span>
      </Tooltip>
      {data?.configured && (
        <Button size="small" onClick={() => setPicking(true)}>
          Change
        </Button>
      )}
      <Button size="small" color="inherit" onClick={unlink}>
        Unlink
      </Button>
    </div>
  );
}
