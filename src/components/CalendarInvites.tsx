import React from 'react';
import dayjs from 'dayjs';
import Autocomplete from '@mui/material/Autocomplete';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApplicationEventType, CalendarInvite, JobApplication } from '../types';
import { eventTypes, formatDuration, formatEventTime } from '../eventTypes';
import { fetchApplications } from '../hooks/useApplications';

interface InvitesResponse {
  configured: boolean;
  invites: CalendarInvite[];
}

const fetchInvites = async (): Promise<InvitesResponse> => {
  const res = await fetch('/api/calendar/invites');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Could not load calendar invites');
  return body;
};

const useCalendarInvites = () =>
  useQuery({
    queryKey: ['calendar-invites'],
    queryFn: fetchInvites,
    staleTime: 5 * 60 * 1000,
  });

const post = async (path: string, body: unknown) => {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error ?? 'Request failed');
};

const appLabel = (app: JobApplication) => `${app.name ?? ''}${app.role ? ` — ${app.role}` : ''}`;

// The user's choices for one invite before they click Link
interface Draft {
  applicationId: string;
  type: ApplicationEventType;
}

// Button for the calendar header; the badge counts invites that match an application
export function CalendarInvitesButton() {
  const { data } = useCalendarInvites();
  const [open, setOpen] = React.useState(false);
  const matchedCount = data?.invites.filter((i) => i.suggestion).length ?? 0;

  return (
    <>
      <Tooltip title={matchedCount ? `${matchedCount} new interview invite(s)` : 'Calendar invites'}>
        <IconButton size="small" aria-label="Calendar invites" onClick={() => setOpen(true)}>
          <Badge badgeContent={matchedCount} color="primary">
            <EventAvailableIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <CalendarInvitesDialog onClose={() => setOpen(false)} />
      </Dialog>
    </>
  );
}

function CalendarInvitesDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const invitesQuery = useCalendarInvites();
  // All applications, ignoring the page-wide company search
  const { data: applications = [] } = useQuery<JobApplication[], Error>({
    queryKey: ['applications'],
    queryFn: fetchApplications,
  });
  const [drafts, setDrafts] = React.useState<Record<string, Draft>>({});
  const [showAll, setShowAll] = React.useState(false);
  const [busyUid, setBusyUid] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const sortedApps = React.useMemo(
    () => [...applications].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [applications],
  );

  const configured = invitesQuery.data?.configured !== false;
  const invites = invitesQuery.data?.invites ?? [];
  const matched = invites.filter((i) => i.suggestion);
  const visible = showAll ? invites : matched;

  const draftFor = (invite: CalendarInvite): Draft =>
    drafts[invite.uid] ?? {
      applicationId: invite.suggestion?.applicationId ?? '',
      type: invite.suggestedType,
    };
  const setDraft = (uid: string, draft: Draft) => setDrafts((prev) => ({ ...prev, [uid]: draft }));

  const run = async (uid: string, action: () => Promise<void>) => {
    setBusyUid(uid);
    setError(null);
    try {
      await action();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['calendar-invites'] }),
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
      ]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyUid(null);
    }
  };

  const link = (invite: CalendarInvite) => {
    const draft = draftFor(invite);
    return run(invite.uid, () =>
      post('/api/calendar/invites/link', {
        applicationId: draft.applicationId,
        type: draft.type,
        invite,
      }),
    );
  };

  const dismiss = (invite: CalendarInvite) =>
    run(invite.uid, () => post('/api/calendar/invites/dismiss', { uid: invite.uid }));

  let body: React.ReactNode;
  if (!configured) {
    body = (
      <div className="week-calendar-empty">
        Add your calendar's share link as CALENDAR_ICS_URLS in server/.env to import interview
        invites.
      </div>
    );
  } else if (invitesQuery.isLoading) {
    body = <div className="week-calendar-empty">Loading calendar…</div>;
  } else if (visible.length === 0) {
    body = (
      <div className="week-calendar-empty">
        {invites.length ? 'No invites match an application' : 'No new calendar invites'}
      </div>
    );
  } else {
    body = (
      <div className="calendar-invites-list">
        {visible.map((invite) => {
          const draft = draftFor(invite);
          const time = formatEventTime({ type: draft.type, date: invite.date, time: invite.time });
          const busy = busyUid === invite.uid;
          return (
            <div
              key={invite.uid}
              className="calendar-invite"
              style={{ borderLeftColor: eventTypes[draft.type].color }}
            >
              <div className="calendar-invite-info">
                <div className="week-calendar-event-type">{invite.title}</div>
                <div className="week-calendar-event-time">
                  {dayjs(invite.date).format('ddd, MMM D')}
                  {time && ` · ${time}`}
                  {invite.duration && ` · ${formatDuration(invite.duration)}`}
                </div>
                {invite.organizer && (
                  <div className="week-calendar-event-role">From {invite.organizer}</div>
                )}
                {invite.suggestion && (
                  <div className="calendar-invite-reason">Suggested: {invite.suggestion.reason}</div>
                )}
              </div>
              <div className="calendar-invite-actions">
                <Autocomplete
                  size="small"
                  options={sortedApps}
                  value={sortedApps.find((a) => a.id === draft.applicationId) ?? null}
                  onChange={(_, app) =>
                    setDraft(invite.uid, { ...draft, applicationId: app?.id ?? '' })
                  }
                  getOptionLabel={appLabel}
                  isOptionEqualToValue={(a, b) => a.id === b.id}
                  renderInput={(params) => <TextField {...params} label="Application" />}
                  sx={{ width: 240 }}
                />
                <TextField
                  select
                  size="small"
                  label="Type"
                  value={draft.type}
                  onChange={(e) =>
                    setDraft(invite.uid, { ...draft, type: e.target.value as ApplicationEventType })
                  }
                  sx={{ minWidth: 160 }}
                >
                  {Object.entries(eventTypes).map(([value, { label }]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!draft.applicationId || busy}
                  onClick={() => link(invite)}
                >
                  Link
                </Button>
                <Button size="small" disabled={busy} onClick={() => dismiss(invite)}>
                  Ignore
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <DialogTitle className="calendar-invites-dialog-title">
        <span>Calendar Invites</span>
        <span className="week-calendar-nav">
          {invites.length > matched.length && (
            <Button size="small" onClick={() => setShowAll((v) => !v)}>
              {showAll
                ? 'Show matched only'
                : `Show all events (${invites.length - matched.length} more)`}
            </Button>
          )}
          {configured && (
            <Tooltip title="Refresh from calendar">
              <span>
                <IconButton
                  size="small"
                  onClick={() => invitesQuery.refetch()}
                  disabled={invitesQuery.isFetching}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          )}
          <IconButton size="small" aria-label="Close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </span>
      </DialogTitle>
      <DialogContent>
        {invitesQuery.isError && (
          <div className="calendar-invites-error">{invitesQuery.error.message}</div>
        )}
        {error && <div className="calendar-invites-error">{error}</div>}
        {body}
      </DialogContent>
    </>
  );
}
