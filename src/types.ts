
export interface JobApplication {
  id: string; // uuid NOT NULL
  name: string | null; // varchar(50) NULL
  date_applied: string | null; // 'YYYY-MM-DD' (postgres date)
  status: string | null; // varchar(50) NULL
  role: string | null; // varchar(50) NULL
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  notes: string | null;
  source: 'inbound' | 'outbound' | null;
  point_of_contact_name: string | null; // text NULL
  point_of_contact_email: string | null; // text NULL
  events: ApplicationEvent[]; // jsonb NOT NULL DEFAULT '[]'
}

export type ApplicationEventType =
  | 'phone_screen'
  | 'technical_screen'
  | 'coding_interview'
  | 'onsite'
  | 'offer'
  | 'rejected';

export interface ApplicationEvent {
  type: ApplicationEventType;
  date: string; // YYYY-MM-DD
  time?: string | null; // HH:mm (24h), optional
  duration?: number | null; // minutes, optional (treated as 60 when missing)
  notes?: string;
  calendar_uid?: string; // iCalendar UID when linked from a calendar invite
  // Invite version the user chose to keep their own details over ("Keep mine")
  calendar_ack?: { date: string; time: string | null; duration: number | null } | { cancelled: true };
}

// An event from the user's calendar feed that isn't linked to an application yet
export interface CalendarInvite {
  uid: string;
  title: string;
  description: string;
  location: string;
  date: string; // YYYY-MM-DD
  time: string | null; // HH:mm, null for all-day events
  duration: number | null; // minutes
  organizer: string | null;
  participants: string[];
  suggestedType: ApplicationEventType;
  suggestion: { applicationId: string; reason: string } | null;
}
export interface CalendarSlot {
  date: string;
  time: string | null;
  duration: number | null;
}

// A linked event whose calendar invite has since moved or been cancelled
export interface CalendarChange {
  kind: 'rescheduled' | 'cancelled';
  applicationId: string;
  applicationName: string | null;
  eventType: ApplicationEventType;
  uid: string;
  title: string;
  from: CalendarSlot; // the event as saved in the app
  to: CalendarSlot; // the invite as it is in the calendar now
}
