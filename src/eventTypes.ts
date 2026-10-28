import type { ApplicationEventType } from './types';

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
