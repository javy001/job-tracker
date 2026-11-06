import type { JobApplication } from './types';

const hasResponse = (d: JobApplication) => d.events.length > 0;

// Table filters selectable by clicking a metric card
export const metricFilters = {
  responses: hasResponse,
  inboundResponses: (d: JobApplication) => d.source === 'inbound' && hasResponse(d),
  outboundResponses: (d: JobApplication) => d.source === 'outbound' && hasResponse(d),
  rejected: (d: JobApplication) => d.events.some((e) => e.type === 'rejected'),
};

export type MetricFilter = keyof typeof metricFilters;
