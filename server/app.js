const express = require('express');
const applicationRouter = require('./routes/applications');
const app = express();
const PORT = 5000;

// Middleware to parse incoming JSON payloads
app.use(express.json());

app.use('/api', applicationRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is successfully running on http://localhost:${PORT}`);
});
