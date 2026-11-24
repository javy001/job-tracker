import React from 'react';
import { CalendarCheckIcon, CalendarXIcon, VideoIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
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
      <div className="flex min-h-7 items-center gap-1.5">
        <Select defaultOpen onValueChange={link}>
          <SelectTrigger
            aria-label="Calendar invite"
            className="min-w-0 flex-1 bg-background"
          >
            <SelectValue placeholder="Choose a calendar invite" />
          </SelectTrigger>
          <SelectContent>
            {candidates.length === 0 && (
              <SelectItem value="__none" disabled>
                No other invites available
              </SelectItem>
            )}
            {candidates.map((i) => (
              <SelectItem key={i.uid} value={i.uid}>
                {i.title} · {formatSlot(i)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Cancel"
          onClick={() => setPicking(false)}
        >
          <XIcon />
        </Button>
      </div>
    );
  }

  if (!event.calendar_uid) {
    return (
      <div className="flex min-h-7 items-center">
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 text-muted-foreground"
          onClick={() => setPicking(true)}
        >
          <CalendarCheckIcon />
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
    <div className="flex flex-col gap-1.5">
      <div
        className={cn(
          'flex min-h-7 items-center gap-1.5 rounded-md py-0.5 pr-0.5 pl-2',
          cancelled
            ? 'bg-destructive/10 text-destructive'
            : 'bg-primary/10 text-primary dark:text-[#9db2ff]',
        )}
      >
        {cancelled ? (
          <CalendarXIcon className="size-3.5 shrink-0" />
        ) : (
          <CalendarCheckIcon className="size-3.5 shrink-0" />
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="min-w-0 flex-1 truncate text-xs">{description}</span>
          </TooltipTrigger>
          <TooltipContent>{description}</TooltipContent>
        </Tooltip>
        {linked?.meetingUrl && !cancelled && (
          <Button variant="ghost" size="xs" asChild>
            <a href={linked.meetingUrl} target="_blank" rel="noopener noreferrer">
              <VideoIcon />
              Join call
            </a>
          </Button>
        )}
        {data?.configured && (
          <Button variant="ghost" size="xs" onClick={() => setPicking(true)}>
            Change
          </Button>
        )}
        <Button
          variant="ghost"
          size="xs"
          className="text-muted-foreground"
          onClick={unlink}
        >
          Unlink
        </Button>
      </div>
      {linked?.description && <InviteDescription text={linked.description} />}
    </div>
  );
}

const LINK_PATTERN = /(https?:\/\/[^\s<>"')\]]+)/g;

// The invite's description as plain text with clickable links, clamped to a
// few lines until expanded
function InviteDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = React.useState(false);
  const long = text.length > 240 || text.split('\n').length > 4;

  return (
    <div className="rounded-md bg-background/60 px-2 py-1.5 text-xs text-muted-foreground">
      <p
        className={cn(
          'break-words whitespace-pre-line',
          !expanded && long && 'line-clamp-4',
        )}
      >
        {text.split(LINK_PATTERN).map((part, i) =>
          i % 2 === 1 ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline dark:text-[#9db2ff]"
            >
              {part}
            </a>
          ) : (
            part
          ),
        )}
      </p>
      {long && (
        <button
          type="button"
          className="mt-0.5 text-foreground hover:underline"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
