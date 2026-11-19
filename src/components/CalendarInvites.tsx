import React from 'react';
import dayjs from 'dayjs';
import { CalendarCheckIcon, CheckIcon, ChevronsUpDownIcon, RefreshCwIcon, XIcon } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  ApplicationEventType,
  CalendarChange,
  CalendarInvite,
  JobApplication,
} from '../types';
import { eventTypes, formatDuration, formatEventTime, formatSlot } from '../eventTypes';
import { useCalendarInvites } from '../hooks/useCalendarInvites';
import { fetchApplications } from '../hooks/useApplications';

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

  const badgeCount = matchedCount + changeCount;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Calendar invites"
            className="relative"
            onClick={() => setOpen(true)}
          >
            <CalendarCheckIcon />
            {badgeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-medium text-primary-foreground tabular-nums">
                {badgeCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="max-h-[85vh] gap-0 overflow-y-auto p-0 sm:max-w-3xl"
        >
          <CalendarInvitesDialog onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Searchable application picker
function ApplicationCombobox({
  applications,
  value,
  onChange,
}: {
  applications: JobApplication[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = applications.find((a) => a.id === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Application"
          className="w-60 justify-between font-normal"
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected ? appLabel(selected) : 'Choose application'}
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search applications" />
          <CommandList>
            <CommandEmpty>No applications found</CommandEmpty>
            <CommandGroup>
              {applications.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${appLabel(a)} ${a.id}`}
                  onSelect={() => {
                    onChange(a.id === value ? '' : a.id);
                    setOpen(false);
                  }}
                >
                  <CheckIcon className={cn(a.id === value ? 'opacity-100' : 'opacity-0')} />
                  <span className="truncate">{appLabel(a)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function EventTypeSelect({
  value,
  onChange,
}: {
  value: ApplicationEventType;
  onChange: (type: ApplicationEventType) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ApplicationEventType)}>
      <SelectTrigger aria-label="Event type" className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(eventTypes).map(([type, { label, color }]) => (
          <SelectItem key={type} value={type}>
            <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const inviteRow =
  'flex flex-wrap items-center justify-between gap-3 rounded-md border border-l-[3px] bg-background px-3 py-2';
const sectionTitle = 'mb-2 mt-4 text-[11px] font-medium text-subtle-foreground first:mt-0';
const emptyState = 'py-6 text-center text-[13px] text-subtle-foreground';

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
      <div className={sectionTitle}>Schedule changes</div>
      <div className="flex flex-col gap-2">
        {changes.map((change) => {
          const busyKey = `${change.applicationId}:${change.uid}`;
          const busy = busyUid === busyKey;
          const cancelled = change.kind === 'cancelled';
          return (
            <div
              key={busyKey}
              className={inviteRow}
              style={{ borderLeftColor: cancelled ? 'var(--destructive)' : 'var(--warning)' }}
            >
              <div className="min-w-0 flex-[1_1_220px] text-xs">
                <div className="text-[13px] font-medium">
                  {change.applicationName} · {eventTypes[change.eventType]?.label ?? change.eventType}
                </div>
                <div className="text-subtle-foreground">{change.title}</div>
                {cancelled ? (
                  <div className="mt-0.5 text-destructive">
                    Cancelled · was {formatSlot(change.from)}
                  </div>
                ) : (
                  <div className="mt-0.5">
                    <s className="text-subtle-foreground">{formatSlot(change.from)}</s> → <strong>{formatSlot(change.to)}</strong>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {cancelled ? (
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() => resolve(change, 'remove')}
                  >
                    Remove event
                  </Button>
                ) : (
                  <Button
                    disabled={busy}
                    onClick={() => resolve(change, 'update')}
                  >
                    Update
                  </Button>
                )}
                <Button variant="ghost" disabled={busy} onClick={() => resolve(change, 'keep')}>
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
      <div className={emptyState}>
        Add your calendar's share link as CALENDAR_ICS_URLS in server/.env to import interview
        invites.
      </div>
    );
  } else if (invitesQuery.isLoading) {
    body = <div className={emptyState}>Loading calendar…</div>;
  } else if (visible.length === 0) {
    body = (
      <div className={emptyState}>
        {viewIgnored
          ? 'No ignored invites'
          : invites.length
            ? 'No invites match an application'
            : 'No new calendar invites'}
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-2">
        {visible.map((invite) => {
          const draft = draftFor(invite);
          const time = formatEventTime({ type: draft.type, date: invite.date, time: invite.time });
          const busy = busyUid === invite.uid;
          return (
            <div
              key={invite.uid}
              className={inviteRow}
              style={{ borderLeftColor: eventTypes[draft.type].color }}
            >
              <div className="min-w-0 flex-[1_1_220px] text-xs">
                <div className="text-[13px] font-medium">{invite.title}</div>
                <div className="text-muted-foreground">
                  {dayjs(invite.date).format('ddd, MMM D')}
                  {time && ` · ${time}`}
                  {invite.duration && ` · ${formatDuration(invite.duration)}`}
                </div>
                {invite.organizer && (
                  <div className="text-subtle-foreground">From {invite.organizer}</div>
                )}
                {invite.suggestion && (
                  <div className="mt-0.5 text-primary dark:text-[#9db2ff]">Suggested: {invite.suggestion.reason}</div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <ApplicationCombobox
                  applications={sortedApps}
                  value={draft.applicationId}
                  onChange={(applicationId) => setDraft(invite.uid, { ...draft, applicationId })}
                />
                <EventTypeSelect
                  value={draft.type}
                  onChange={(type) => setDraft(invite.uid, { ...draft, type })}
                />
                <Button
                  disabled={!draft.applicationId || busy}
                  onClick={() => link(invite)}
                >
                  Link
                </Button>
                {viewIgnored ? (
                  <Button variant="ghost" disabled={busy} onClick={() => restore(invite)}>
                    Restore
                  </Button>
                ) : (
                  <Button variant="ghost" disabled={busy} onClick={() => dismiss(invite)}>
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
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-2.5">
        <DialogTitle className="text-sm font-semibold">
          {viewIgnored ? 'Ignored invites' : 'Calendar invites'}
        </DialogTitle>
        <div className="flex flex-wrap items-center gap-1">
          {(viewIgnored || ignored.length > 0) && (
            <Button variant="ghost" onClick={() => setViewIgnored((v) => !v)}>
              {viewIgnored ? 'Back to invites' : `Ignored (${ignored.length})`}
            </Button>
          )}
          {!viewIgnored && invites.length > matched.length && (
            <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll
                ? 'Show matched only'
                : `Show all events (${invites.length - matched.length} more)`}
            </Button>
          )}
          {configured && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Refresh from calendar"
                  onClick={() => invitesQuery.refetch()}
                  disabled={invitesQuery.isFetching}
                >
                  <RefreshCwIcon className={cn(invitesQuery.isFetching && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh from calendar</TooltipContent>
            </Tooltip>
          )}
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <XIcon />
          </Button>
        </div>
      </div>
      <div className="p-4">
        {invitesQuery.isError && (
          <div className="mb-2 text-xs text-destructive">{invitesQuery.error.message}</div>
        )}
        {error && <div className="mb-2 text-xs text-destructive">{error}</div>}
        {changesSection}
        {configured && !viewIgnored && changes.length > 0 && (
          <div className={sectionTitle}>New invites</div>
        )}
        {body}
      </div>
    </>
  );
}
