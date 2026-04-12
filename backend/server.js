const express = require('express');
const path = require('path');
const patientsRouter = require('./src/routes/patients');
require('dotenv').config({ path: '../.env' });

// Define endpoints here
const clinicsRouter = require('./src/routes/clinics');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve frontend as static files — no CORS needed
app.use(express.static(path.join(__dirname, '../frontend')));


// Add API routes here
app.use('/api/clinics', clinicsRouter);
app.use('/api/patients', patientsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});