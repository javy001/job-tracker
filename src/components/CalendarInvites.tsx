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
import type {
  ApplicationEventType,
  CalendarChange,
  CalendarInvite,
  CalendarSlot,
  JobApplication,
} from '../types';
import { eventTypes, formatDuration, formatEventTime } from '../eventTypes';
import { fetchApplications } from '../hooks/useApplications';

interface InvitesResponse {
  configured: boolean;
  invites: CalendarInvite[];
  ignored: CalendarInvite[];
  changes: CalendarChange[];
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

// "Thu, Nov 20 · 11:00 AM · 45 min"
const formatSlot = (slot: CalendarSlot) =>
  [
    dayjs(slot.date).format('ddd, MMM D'),
    slot.time && dayjs(`2000-01-01T${slot.time}`).format('h:mm A'),
    slot.duration && formatDuration(slot.duration),
  ]
    .filter(Boolean)
    .join(' · ');

const appLabel = (app: JobApplication) => `${app.name ?? ''}${app.role ? ` — ${app.role}` : ''}`;

// The user's choices for one invite before they click Link
interface Draft {
  applicationId: string;
  type: ApplicationEventType;
}

// Button for the calendar header; the badge counts invites that match an
// application plus linked events whose invite was rescheduled or cancelled
export function CalendarInvitesButton() {
  const { data } = useCalendarInvites();
  const [open, setOpen] = React.useState(false);
  const matchedCount = data?.invites.filter((i) => i.suggestion).length ?? 0;
  const changeCount = data?.changes?.length ?? 0;
  const tooltip =
    [
      matchedCount && `${matchedCount} new interview invite${matchedCount === 1 ? '' : 's'}`,
      changeCount && `${changeCount} schedule change${changeCount === 1 ? '' : 's'}`,
    ]
      .filter(Boolean)
      .join(', ') || 'Calendar invites';

  return (
    <>
      <Tooltip title={tooltip}>
        <IconButton size="small" aria-label="Calendar invites" onClick={() => setOpen(true)}>
          <Badge badgeContent={matchedCount + changeCount} color="primary">
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
  const [viewIgnored, setViewIgnored] = React.useState(false);
  const [busyUid, setBusyUid] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const sortedApps = React.useMemo(
    () => [...applications].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
    [applications],
  );

  const configured = invitesQuery.data?.configured !== false;
  const invites = invitesQuery.data?.invites ?? [];
  const ignored = invitesQuery.data?.ignored ?? [];
  const changes = invitesQuery.data?.changes ?? [];
  const matched = invites.filter((i) => i.suggestion);
  const visible = viewIgnored ? ignored : showAll ? invites : matched;

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

  const restore = (invite: CalendarInvite) =>
    run(invite.uid, () => post('/api/calendar/invites/restore', { uid: invite.uid }));

  const resolve = (change: CalendarChange, action: 'update' | 'keep' | 'remove') =>
    run(`${change.applicationId}:${change.uid}`, () =>
      post('/api/calendar/changes/resolve', {
        applicationId: change.applicationId,
        uid: change.uid,
        kind: change.kind,
        action,
        to: change.to,
      }),
    );

  const changesSection = !viewIgnored && changes.length > 0 && (
    <>
      <div className="calendar-invites-section-title">Schedule changes</div>
      <div className="calendar-invites-list">
        {changes.map((change) => {
          const busyKey = `${change.applicationId}:${change.uid}`;
          const busy = busyUid === busyKey;
          const cancelled = change.kind === 'cancelled';
          return (
            <div
              key={busyKey}
              className="calendar-invite"
              style={{ borderLeftColor: cancelled ? '#d62728' : '#f59e0b' }}
            >
              <div className="calendar-invite-info">
                <div className="week-calendar-event-type">
                  {change.applicationName} · {eventTypes[change.eventType]?.label ?? change.eventType}
                </div>
                <div className="week-calendar-event-role">{change.title}</div>
                {cancelled ? (
                  <div className="calendar-invite-change">
                    Cancelled · was {formatSlot(change.from)}
                  </div>
                ) : (
                  <div className="calendar-invite-change">
                    <s>{formatSlot(change.from)}</s> → <strong>{formatSlot(change.to)}</strong>
                  </div>
                )}
              </div>
              <div className="calendar-invite-actions">
                {cancelled ? (
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    disabled={busy}
                    onClick={() => resolve(change, 'remove')}
                  >
                    Remove event
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    disabled={busy}
                    onClick={() => resolve(change, 'update')}
                  >
                    Update
                  </Button>
                )}
                <Button size="small" disabled={busy} onClick={() => resolve(change, 'keep')}>
                  Keep mine
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

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
        {viewIgnored
          ? 'No ignored invites'
          : invites.length
            ? 'No invites match an application'
            : 'No new calendar invites'}
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
                {viewIgnored ? (
                  <Button size="small" disabled={busy} onClick={() => restore(invite)}>
                    Restore
                  </Button>
                ) : (
                  <Button size="small" disabled={busy} onClick={() => dismiss(invite)}>
                    Ignore
                  </Button>
                )}
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
        <span>{viewIgnored ? 'Ignored Invites' : 'Calendar Invites'}</span>
        <span className="week-calendar-nav">
          {(viewIgnored || ignored.length > 0) && (
            <Button size="small" onClick={() => setViewIgnored((v) => !v)}>
              {viewIgnored ? 'Back to invites' : `Ignored (${ignored.length})`}
            </Button>
          )}
          {!viewIgnored && invites.length > matched.length && (
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
        {changesSection}
        {configured && !viewIgnored && changes.length > 0 && (
          <div className="calendar-invites-section-title">New invites</div>
        )}
        {body}
      </DialogContent>
    </>
  );
}
