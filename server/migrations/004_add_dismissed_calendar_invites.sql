-- Calendar invites the user chose to ignore, keyed by the iCalendar UID,
-- so they stop showing up in the "Calendar Invites" panel.
-- (Linked invites are tracked by `calendar_uid` on the application's events.)
CREATE TABLE IF NOT EXISTS jobs.dismissed_calendar_invites (
  uid text PRIMARY KEY,
  dismissed_at timestamptz NOT NULL DEFAULT now()
);
