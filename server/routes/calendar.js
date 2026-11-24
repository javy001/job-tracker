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

// Hosts of video call services whose links count as the invite's meeting link
const MEETING_HOST = /(^|\.)(zoom\.us|zoomgov\.com|meet\.google\.com|teams\.microsoft\.com|teams\.live\.com|webex\.com|whereby\.com|meet\.jit\.si|gotomeeting\.com|meet\.goto\.com|chime\.aws|bluejeans\.com|around\.co|meet\.around\.co|app\.cal\.com|coderpad\.io|hackerrank\.com|codesignal\.com)$/i;

const isMeetingUrl = (s) => {
  try {
    const u = new URL(s);
    return /^https?:$/.test(u.protocol) && MEETING_HOST.test(u.hostname);
  } catch {
    return false;
  }
};

const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi;

// Calendar descriptions are sometimes HTML; reduce them to plain text
const htmlToText = (s) =>
  !/<[a-z][^>]*>/i.test(s)
    ? s
    : s
        .replace(/<a\s[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, (_, href, label) =>
          label.replace(/<[^>]+>/g, '').trim() === href ? href : `${label} (${href})`)
        .replace(/<br\s*\/?>|<\/(p|div|li|h\d)>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

// Drop the dial-in boilerplate Google Meet and Teams append to descriptions;
// the meeting link is surfaced on its own
const cleanDescription = (raw) =>
  htmlToText(raw)
    .replace(/-::~:~::~[\s\S]*?(-::~:~::~[:~]*-?|$)/g, '')
    .replace(/_{20,}[\s\S]*?(_{20,}|$)/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// The invite's video call link: a conferencing property if the calendar set
// one, else the first video-call link in the location, URL or description
const meetingUrlOf = (ev) => {
  const props = [
    ev['GOOGLE-CONFERENCE'],
    ev['MICROSOFT-SKYPETEAMSMEETINGURL'],
    ev['MICROSOFT-ONLINEMEETINGCONFLINK'],
    ev['MICROSOFT-ONLINEMEETINGEXTERNALLINK'],
  ].map(text).filter((u) => /^https?:\/\//i.test(u));
  if (props.length) return props[0];
  const candidates = [text(ev.location), text(ev.url), text(ev.description)]
    .flatMap((s) => htmlToText(s).match(URL_PATTERN) ?? [])
    .map((u) => u.replace(/[.,;:]+$/, ''));
  return candidates.find(isMeetingUrl) ?? null;
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
      // Interviews aren't recurring; skip series. Cancelled events are kept
      // (flagged) so linked events can be offered for removal.
      if (ev.rrule || ev.recurrenceid) continue;
      const start = new Date(ev.start);
      if (start.getTime() < from || start.getTime() > to) continue;

      const allDay = ev.datetype === 'date' || ev.start.dateOnly === true;
      const end = ev.end ? new Date(ev.end) : null;
      const minutes = end ? Math.round((end - start) / 60000) : null;
      const title = text(ev.summary) || '(No title)';

      invites.push({
        uid: ev.uid,
        title,
        description: cleanDescription(text(ev.description)).slice(0, 4000),
        location: text(ev.location),
        meetingUrl: meetingUrlOf(ev),
        date: localDate(start),
        time: allDay ? null : localTime(start),
        duration: !allDay && minutes > 0 && minutes <= 24 * 60 ? minutes : null,
        organizer: emailsOf(ev.organizer)[0] ?? null,
        participants: [...new Set([...emailsOf(ev.organizer), ...emailsOf(ev.attendee)])],
        suggestedType: guessType(title),
        cancelled: text(ev.status).toUpperCase() === 'CANCELLED',
      });
    }
  }
  return invites.sort((a, b) => `${a.date} ${a.time ?? ''}`.localeCompare(`${b.date} ${b.time ?? ''}`));
};

// The parts of an event a reschedule can change
const slotOf = (x) => ({ date: x.date, time: x.time ?? null, duration: x.duration ?? null });
const sameSlot = (a, b) =>
  a.date === b.date && (a.time ?? null) === (b.time ?? null) && (a.duration ?? null) === (b.duration ?? null);

// Linked events whose invite has since moved or been cancelled. An event's
// `calendar_ack` records an invite version the user chose to keep their own
// details over ("Keep mine"), so that version isn't offered again.
const findChanges = (invites, applications) => {
  const byUid = new Map(invites.map((i) => [i.uid, i]));
  const changes = [];
  for (const app of applications) {
    for (const event of app.events ?? []) {
      const invite = event.calendar_uid && byUid.get(event.calendar_uid);
      if (!invite) continue;
      const ack = event.calendar_ack;
      if (invite.cancelled) {
        if (ack?.cancelled) continue;
        changes.push({ kind: 'cancelled', ...changeBase(app, event, invite) });
      } else if (!sameSlot(event, invite) && !(ack && !ack.cancelled && sameSlot(ack, invite))) {
        changes.push({ kind: 'rescheduled', ...changeBase(app, event, invite) });
      }
    }
  }
  return changes;
};

const changeBase = (app, event, invite) => ({
  applicationId: app.id,
  applicationName: app.name,
  eventType: event.type,
  uid: invite.uid,
  title: invite.title,
  from: slotOf(event),
  to: slotOf(invite),
});

// --- GET /api/calendar/invites: feed events not yet linked (split into new
// and ignored), the linked ones, plus changes to linked ones ---
router.get('/calendar/invites', async (req, res) => {
  if (feedUrls().length === 0) {
    return res.json({ configured: false, invites: [], ignored: [], linked: [], changes: [] });
  }
  try {
    const [invites, apps, dismissed] = await Promise.all([
      fetchInvites(),
      pool.query('SELECT id, name, point_of_contact_email, events FROM jobs.applications'),
      pool.query('SELECT uid FROM jobs.dismissed_calendar_invites'),
    ]);
    const ignoredUids = new Set(dismissed.rows.map((r) => r.uid));
    const linkedUids = new Set();
    for (const app of apps.rows) {
      for (const e of app.events ?? []) if (e.calendar_uid) linkedUids.add(e.calendar_uid);
    }

    const unlinked = invites
      .filter((i) => !i.cancelled && !linkedUids.has(i.uid))
      .map((i) => ({ ...i, suggestion: suggestApplication(i, apps.rows) }));
    res.json({
      configured: true,
      invites: unlinked.filter((i) => !ignoredUids.has(i.uid)),
      ignored: unlinked.filter((i) => ignoredUids.has(i.uid)),
      linked: invites.filter((i) => linkedUids.has(i.uid)),
      changes: findChanges(invites, apps.rows),
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: `Could not load calendar feed: ${err.message}` });
  }
});

// { date: 'YYYY-MM-DD', time?: 'HH:mm' | null, duration?: minutes | null }
const isValidSlot = (x) =>
  !!x &&
  /^\d{4}-\d{2}-\d{2}$/.test(x.date ?? '') &&
  (x.time == null || /^([01]\d|2[0-3]):[0-5]\d$/.test(x.time)) &&
  (x.duration == null || (Number.isInteger(x.duration) && x.duration > 0 && x.duration <= 1440));

const VALID_TYPES = ['phone_screen', 'technical_screen', 'coding_interview', 'onsite', 'offer', 'rejected'];

// --- POST /api/calendar/invites/link: add an invite as an application event ---
router.post('/calendar/invites/link', async (req, res) => {
  const { applicationId, type, invite } = req.body ?? {};
  if (!applicationId || !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: 'applicationId and a valid type are required' });
  }
  if (!invite || typeof invite.uid !== 'string' || !isValidSlot(invite)) {
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
    // A linked invite is no longer ignored (it may have been linked from the Ignored list)
    await pool.query('DELETE FROM jobs.dismissed_calendar_invites WHERE uid = $1', [invite.uid]);
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

// --- POST /api/calendar/invites/restore: move an ignored invite back to the new list ---
router.post('/calendar/invites/restore', async (req, res) => {
  const { uid } = req.body ?? {};
  if (typeof uid !== 'string' || !uid) return res.status(400).json({ error: 'uid is required' });
  try {
    await pool.query('DELETE FROM jobs.dismissed_calendar_invites WHERE uid = $1', [uid]);
    res.json({ message: 'Invite restored' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database server error occurred' });
  }
});

// --- POST /api/calendar/changes/resolve: act on a rescheduled/cancelled invite ---
// action 'update' moves the linked event to `to`; 'keep' leaves it as is and
// remembers this invite version; 'remove' deletes the linked event.
router.post('/calendar/changes/resolve', async (req, res) => {
  const { applicationId, uid, action, kind, to } = req.body ?? {};
  if (!applicationId || typeof uid !== 'string' || !['update', 'keep', 'remove'].includes(action)) {
    return res.status(400).json({ error: 'applicationId, uid and action are required' });
  }
  if (action !== 'remove' && kind !== 'cancelled' && !isValidSlot(to)) {
    return res.status(400).json({ error: 'to must include a valid date, time and duration' });
  }
  if (action === 'update' && kind === 'cancelled') {
    return res.status(400).json({ error: 'A cancelled invite can only be kept or removed' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query(
      'SELECT events FROM jobs.applications WHERE id = $1 FOR UPDATE',
      [applicationId]
    );
    if (found.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Application not found' });
    }

    const events = found.rows[0].events ?? [];
    if (!events.some((e) => e.calendar_uid === uid)) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No event on this application is linked to that invite' });
    }

    let updated;
    if (action === 'remove') {
      updated = events.filter((e) => e.calendar_uid !== uid);
    } else if (action === 'update') {
      // Taking the new time makes any earlier "Keep mine" moot
      updated = events.map((e) => {
        if (e.calendar_uid !== uid) return e;
        const next = { ...e, ...slotOf(to) };
        delete next.calendar_ack;
        return next;
      });
    } else {
      const ack = kind === 'cancelled' ? { cancelled: true } : slotOf(to);
      updated = events.map((e) => (e.calendar_uid === uid ? { ...e, calendar_ack: ack } : e));
    }

    const result = await client.query(
      'UPDATE jobs.applications SET events = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(updated), applicationId]
    );
    await client.query('COMMIT');
    res.json({ message: 'Change resolved', application: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(err);
    res.status(500).json({ error: 'Database server error occurred' });
  } finally {
    client.release();
  }
});

module.exports = router;
