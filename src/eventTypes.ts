import dayjs from 'dayjs';
import type { ApplicationEvent, ApplicationEventType, CalendarSlot } from './types';

// Display label and chart color for each interview event type
export const eventTypes: Record<ApplicationEventType, { label: string; color: string }> = {
  phone_screen: { label: 'Phone Screen', color: '#1f77b4' },
  technical_screen: { label: 'Technical Screen', color: '#9467bd' },
  coding_interview: { label: 'Coding Interview', color: '#ff7f0e' },
  onsite: { label: 'Onsite', color: '#17becf' },
  offer: { label: 'Offer', color: '#2ca02c' },
  rejected: { label: 'Rejected', color: '#d62728' },
};

// Event types that end an application's time in the pipeline
export const closingEventTypes: ApplicationEventType[] = ['offer', 'rejected'];

// Sortable key for an event: date, then time of day (untimed events sort first)
export const eventSortKey = (e: ApplicationEvent) => `${e.date} ${e.time ?? ''}`;

// "2:30 PM" for a timed event, or an empty string when no time is set
export const formatEventTime = (e: ApplicationEvent) =>
  e.time ? dayjs(`2000-01-01T${e.time}`).format('h:mm A') : '';


// Events without a duration are assumed to last an hour
export const DEFAULT_EVENT_DURATION = 60;
export const eventDuration = (e: ApplicationEvent) => e.duration ?? DEFAULT_EVENT_DURATION;

// Choices offered in the event editor, in minutes
export const durationOptions = [15, 30, 45, 60, 90, 120, 180, 240];

// "45 min", "1 hr", "1.5 hr"
export const formatDuration = (minutes: number) =>
  minutes < 60 ? `${minutes} min` : `${+(minutes / 60).toFixed(2)} hr`;

// "Thu, Nov 20 · 11:00 AM · 45 min"
export const formatSlot = (slot: CalendarSlot) =>
  [
    dayjs(slot.date).format('ddd, MMM D'),
    slot.time && dayjs(`2000-01-01T${slot.time}`).format('h:mm A'),
    slot.duration && formatDuration(slot.duration),
  ]
    .filter(Boolean)
    .join(' · ');
