
export interface JobApplication {
  id: string; // uuid NOT NULL
  name: string | null; // varchar(50) NULL
  date_applied: string | null; // timestamp NULL (can also use string if handled as ISO string)
  status: string | null; // varchar(50) NULL
  role: string | null; // varchar(50) NULL
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  notes: string | null;
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
  notes?: string;
}