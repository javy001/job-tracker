-- Interview/pipeline events per application, e.g.
-- [{ "type": "phone_screen", "date": "2026-10-20", "notes": "Recruiter call" }]
ALTER TABLE jobs.applications
  ADD COLUMN IF NOT EXISTS events jsonb NOT NULL DEFAULT '[]'::jsonb;
