const express = require('express');
const applicationRouter = require('./routes/applications');
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware to parse incoming JSON payloads
app.use(express.json());

app.use('/api', applicationRouter);

// Start the server
app.listen(PORT, (err) => {
  if (err) {
    console.error(`Failed to start server on port ${PORT}:`, err.message);
    process.exit(1);
  }
  console.log(`Server is successfully running on http://localhost:${PORT}`);
});
