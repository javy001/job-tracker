import { useQuery } from '@tanstack/react-query';
import type { CalendarChange, CalendarInvite } from '../types';

export interface InvitesResponse {
  configured: boolean;
  invites: CalendarInvite[]; // not linked, not ignored
  ignored: CalendarInvite[]; // not linked, ignored
  linked: CalendarInvite[]; // linked to some application event (may be cancelled)
  changes: CalendarChange[];
}

const fetchInvites = async (): Promise<InvitesResponse> => {
  const res = await fetch('/api/calendar/invites');
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? 'Could not load calendar invites');
  return body;
};

export const useCalendarInvites = () =>
  useQuery({
    queryKey: ['calendar-invites'],
    queryFn: fetchInvites,
    staleTime: 5 * 60 * 1000,
  });
