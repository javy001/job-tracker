const express = require('express');
const router = express.Router();
const pool = require('../db'); // Your PostgreSQL pool file
const { v4: uuidv4 } = require('uuid'); // Import UUID generator

// Events must be an array of { type, date, time?, notes? } objects; time is HH:mm (24h)
const isValidTime = (time) =>
  time === undefined || time === null || /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

const isValidEvents = (events) =>
  Array.isArray(events) &&
  events.every(
    (e) =>
      e &&
      typeof e.type === 'string' &&
      e.type.length > 0 &&
      !isNaN(Date.parse(e.date)) &&
      isValidTime(e.time)
  );

// --- 1. CREATE: Submit a new application (POST /api/applications) ---
router.post('/applications', async (req, res) => {
  const { name, status, role, date, source, events = [] } = req.body;

  if (!name || !status || !role || !date || !source) {
    return res.status(400).json({ error: 'Name and status are required' });
  }
  if (!isValidEvents(events)) {
    return res.status(400).json({ error: 'Events must be an array of { type, date }' });
  }

  const id = uuidv4(); // Generate a random secure UUID v4 string
  // const dateApplied = new Date(); // Generates current ISO timestamp

  try {
    const result = await pool.query(
      'INSERT INTO jobs.applications (id, name, date_applied, status, role, source, events) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, name, date, status, role, source, JSON.stringify(events)]
    );
    res.status(201).json({ message: 'Application submitted!', application: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database server error occurred' });
  }
});

// --- 2. READ ALL: Get all applications (GET /api/applications) ---
router.get('/applications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM jobs.applications ORDER BY date_applied DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database server error occurred' });
  }
});

// --- 3. READ ONE: Get application by UUID (GET /api/applications/:id) ---
router.get('/applications/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM jobs.applications WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database server error occurred' });
  }
});

// --- 4. UPDATE: Update application status or info (PUT /api/applications/:id) ---
router.put('/applications/:id', async (req, res) => {
  const { id } = req.params;
  const { name, status, role, location, salary_min, salary_max, date, events, notes, source } = req.body;

  if (events !== undefined && !isValidEvents(events)) {
    return res.status(400).json({ error: 'Events must be an array of { type, date }' });
  }

  const isValidSalary = (val) =>
    val === undefined || val === null || (typeof val === 'number' && Number.isFinite(val) && val >= 0);
  if (!isValidSalary(salary_min) || !isValidSalary(salary_max)) {
    return res.status(400).json({ error: 'Salary must be a non-negative number or null' });
  }
  if (salary_min != null && salary_max != null && salary_min > salary_max) {
    return res.status(400).json({ error: 'salary_min must be less than or equal to salary_max' });
  }

  if (source !== undefined && !['inbound', 'outbound'].includes(source)) {
    return res.status(400).json({ error: "Source must be 'inbound' or 'outbound'" });
  }

  try {
    const checkApp = await pool.query('SELECT * FROM jobs.applications WHERE id = $1', [id]);
    if (checkApp.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Keep existing table values if fields aren't supplied in req.body
    const updatedName = name || checkApp.rows[0].name;
    const updatedStatus = status || checkApp.rows[0].status;
    const updatedRole = role || checkApp.rows[0].role;
    const updatedLocation = location || checkApp.rows[0].location;
    // !== undefined so the salary range can be cleared by sending null
    const updatedSalaryMin = salary_min !== undefined ? salary_min : checkApp.rows[0].salary_min;
    const updatedSalaryMax = salary_max !== undefined ? salary_max : checkApp.rows[0].salary_max;
    const updatedDate = date || checkApp.rows[0].date_applied;
    const updatedEvents = events ?? checkApp.rows[0].events;
    // ?? rather than || so notes can be cleared with an empty string
    const updatedNotes = notes ?? checkApp.rows[0].notes;
    const updatedSource = source ?? checkApp.rows[0].source;

    const result = await pool.query(
      'UPDATE jobs.applications SET name = $1, status = $2, role = $4, location = $5, salary_min = $6, salary_max = $7, date_applied = $8, events = $9, notes = $10, source = $11 WHERE id = $3 RETURNING *',
      [updatedName, updatedStatus, id, updatedRole, updatedLocation, updatedSalaryMin, updatedSalaryMax, updatedDate, JSON.stringify(updatedEvents), updatedNotes, updatedSource]
    );

    res.json({ message: 'Application updated!', application: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database server error occurred' });
  }
});

// --- 5. DELETE: Remove an application (DELETE /api/applications/:id) ---
router.delete('/applications/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM jobs.applications WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application removed successfully', application: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database server error occurred' });
  }
});

module.exports = router;
