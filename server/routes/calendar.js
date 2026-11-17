const express = require('express');
const ical = require('node-ical');
const pool = require('../db');

const router = express.Router();

// Comma-separated iCalendar feed URLs, e.g. an iCloud calendar's public
// share link (webcal://pXX-caldav.icloud.com/published/2/...). Set in server/.env.
const feedUrls = () =>
  (process.env.CALENDAR_ICS_URLS ?? '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
    .map((u) => u.replace(/^webcal:\/\//i, 'https://'));

// Window of calendar events offered for linking
const LOOKBACK_DAYS = 14;
const LOOKAHEAD_DAYS = 180;

// Consumer mail domains say nothing about which company an email belongs to
const FREE_MAIL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com', 'icloud.com', 'me.com', 'mac.com', 'yahoo.com',
  'outlook.com', 'hotmail.com', 'live.com', 'aol.com', 'proton.me', 'protonmail.com',
]);

const pad = (n) => String(n).padStart(2, '0');
const localDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

// node-ical gives text properties as either a string or { val, params }
const text = (v) => (v == null ? '' : typeof v === 'string' ? v : String(v.val ?? ''));

// Email addresses from an ORGANIZER/ATTENDEE property (single or list)
const emailsOf = (prop) =>
  (Array.isArray(prop) ? prop : prop ? [prop] : [])
    .map((p) => text(p).replace(/^mailto:/i, '').trim().toLowerCase())
    .filter((e) => e.includes('@'));

const domainOf = (email) => (email ?? '').split('@')[1]?.toLowerCase() ?? '';
const normalize = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Guess the interview stage from the invite title
const guessType = (title) => {
  const t = title.toLowerCase();
  if (/on-?site|final round|super ?day|loop/.test(t)) return 'onsite';
  if (/coding|live code|pair(ing)? program/.test(t)) return 'coding_interview';
  if (/technical|tech screen|system design/.test(t)) return 'technical_screen';
  return 'phone_screen';
};

// Pick the application an invite most likely belongs to. Strongest signal is a
// participant email equal to the application's point of contact; then a
// participant at the contact's (or the company's) email domain; then the
// company name appearing in the invite text.
const suggestApplication = (invite, applications) => {
  const companyDomains = new Set(
    invite.participants.map(domainOf).filter((d) => d && !FREE_MAIL_DOMAINS.has(d))
  );
  const haystack = normalize(`${invite.title} ${invite.description} ${invite.location}`);

  let best = null;
  for (const app of applications) {
    const contact = (app.point_of_contact_email ?? '').toLowerCase();
    const contactDomain = domainOf(contact);
    const company = normalize(app.name);
    let score = 0;
    let reason = '';

    if (contact && invite.participants.includes(contact)) {
      score = 3;
      reason = `${contact} is the point of contact`;
    } else if (contactDomain && companyDomains.has(contactDomain)) {
      score = 2;
      reason = `Invite includes someone @${contactDomain}`;
    } else if (company.length >= 3 && [...companyDomains].some((d) => normalize(d.split('.').slice(-2, -1)[0]) === company)) {
      score = 2;
      reason = `Invite includes someone at ${app.name}'s domain`;
    } else if (company.length >= 3 && haystack.includes(company)) {
      score = 1;
      reason = `"${app.name}" appears in the invite`;
    }

    if (score > (best?.score ?? 0)) best = { score, applicationId: app.id, reason };
  }
  return best && { applicationId: best.applicationId, reason: best.reason };
};

const fetchInvites = async () => {
  const now = Date.now();
  const from = now - LOOKBACK_DAYS * 864e5;
  const to = now + LOOKAHEAD_DAYS * 864e5;
  const invites = [];

  for (const url of feedUrls()) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Calendar feed returned ${res.status}`);
    const parsed = ical.sync.parseICS(await res.text());

    for (const ev of Object.values(parsed)) {
      if (ev.type !== 'VEVENT' || !ev.start || !ev.uid) continue;
      // Interviews aren't recurring; skip series and cancelled events
      if (ev.rrule || ev.recurrenceid || text(ev.status).toUpperCase() === 'CANCELLED') continue;
      const start = new Date(ev.start);
      if (start.getTime() < from || start.getTime() > to) continue;

      const allDay = ev.datetype === 'date' || ev.start.dateOnly === true;
      const end = ev.end ? new Date(ev.end) : null;
      const minutes = end ? Math.round((end - start) / 60000) : null;
      const title = text(ev.summary) || '(No title)';

      invites.push({
        uid: ev.uid,
        title,
        description: text(ev.description).slice(0, 500),
        location: text(ev.location),
        date: localDate(start),
        time: allDay ? null : localTime(start),
        duration: !allDay && minutes > 0 && minutes <= 24 * 60 ? minutes : null,
        organizer: emailsOf(ev.organizer)[0] ?? null,
        participants: [...new Set([...emailsOf(ev.organizer), ...emailsOf(ev.attendee)])],
        suggestedType: guessType(title),
      });
    }
  }
  return invites.sort((a, b) => `${a.date} ${a.time ?? ''}`.localeCompare(`${b.date} ${b.time ?? ''}`));
};

// --- GET /api/calendar/invites: feed events not yet linked or ignored ---
router.get('/calendar/invites', async (req, res) => {
  if (feedUrls().length === 0) {
    return res.json({ configured: false, invites: [] });
  }
  try {
    const [invites, apps, dismissed] = await Promise.all([
      fetchInvites(),
      pool.query('SELECT id, name, point_of_contact_email, events FROM jobs.applications'),
      pool.query('SELECT uid FROM jobs.dismissed_calendar_invites'),
    ]);
    const handled = new Set(dismissed.rows.map((r) => r.uid));
    for (const app of apps.rows) {
      for (const e of app.events ?? []) if (e.calendar_uid) handled.add(e.calendar_uid);
    }

    const pending = invites
      .filter((i) => !handled.has(i.uid))
      .map((i) => ({ ...i, suggestion: suggestApplication(i, apps.rows) }));
    res.json({ configured: true, invites: pending });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: `Could not load calendar feed: ${err.message}` });
  }
});

const VALID_TYPES = ['phone_screen', 'technical_screen', 'coding_interview', 'onsite', 'offer', 'rejected'];

// --- POST /api/calendar/invites/link: add an invite as an application event ---
router.post('/calendar/invites/link', async (req, res) => {
  const { applicationId, type, invite } = req.body ?? {};
  if (!applicationId || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'applicationId and a valid type are required' });
  }
  if (
    !invite ||
    typeof invite.uid !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(invite.date ?? '') ||
    (invite.time != null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(invite.time)) ||
    (invite.duration != null && !(Number.isInteger(invite.duration) && invite.duration > 0 && invite.duration <= 1440))
  ) {
    return res.status(400).json({ error: 'invite must include uid, date, and valid time/duration' });
  }

  const event = {
    type,
    date: invite.date,
    time: invite.time ?? null,
    duration: invite.duration ?? null,
    notes: typeof invite.title === 'string' ? invite.title.slice(0, 200) : '',
    calendar_uid: invite.uid,
  };

  try {
    // Append unless this invite is already linked to the application
    const result = await pool.query(
      `UPDATE jobs.applications
          SET events = events || $1::jsonb
        WHERE id = $2
          AND NOT events @> $3::jsonb
        RETURNING *`,
      [JSON.stringify([event]), applicationId, JSON.stringify([{ calendar_uid: invite.uid }])]
    );
    if (result.rows.length === 0) {
      const exists = await pool.query('SELECT 1 FROM jobs.applications WHERE id = $1', [applicationId]);
      if (exists.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
      return res.json({ message: 'Invite already linked' });
    }
    res.json({ message: 'Invite linked!', application: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database server error occurred' });
  }
});

// --- POST /api/calendar/invites/dismiss: stop showing an invite ---
router.post('/calendar/invites/dismiss', async (req, res) => {
  const { uid } = req.body ?? {};
  if (typeof uid !== 'string' || !uid) return res.status(400).json({ error: 'uid is required' });
  try {
    await pool.query(
      'INSERT INTO jobs.dismissed_calendar_invites (uid) VALUES ($1) ON CONFLICT DO NOTHING',
      [uid]
    );
    res.json({ message: 'Invite ignored' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database server error occurred' });
  }
});

module.exports = router;
