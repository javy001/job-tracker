-- date_applied is a calendar date, not an instant. It was stored as a UTC
-- wall-clock timestamp in a tz-less column, so evening (Pacific) entries
-- rendered as the next day. Convert back to the local calendar date.
ALTER TABLE jobs.applications
  ALTER COLUMN date_applied TYPE date
  USING (date_applied AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles')::date;
