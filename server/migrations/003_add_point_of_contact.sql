-- Point of contact for an application (e.g. the recruiter).
ALTER TABLE jobs.applications
  ADD COLUMN IF NOT EXISTS point_of_contact_name text,
  ADD COLUMN IF NOT EXISTS point_of_contact_email text;
