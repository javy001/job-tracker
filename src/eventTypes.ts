import dayjs from 'dayjs';
import type { ApplicationEvent, ApplicationEventType } from './types';

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
