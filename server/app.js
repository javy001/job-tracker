const express = require('express');
const applicationRouter = require('./routes/applications');
const calendarRouter = require('./routes/calendar');
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware to parse incoming JSON payloads
app.use(express.json());

app.use('/api', applicationRouter);
app.use('/api', calendarRouter);

// Start the server
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Failed to start server on port ${PORT}:`, err.message);
    process.exit(1);
  }
  console.log(`Server is successfully running on http://localhost:${PORT}`);
});
