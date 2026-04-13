const express = require('express');
const path = require('path');
require('dotenv').config({ path: '../.env' });

// Import route files
const clinicsRouter = require('./src/routes/clinics');
const patientsRouter = require('./src/routes/patients');
const appointmentRouter = require('./src/routes/appointments');

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve frontend as static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Register the routers
app.use('/api/clinics', clinicsRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});