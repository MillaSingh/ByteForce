const { getOperatingHours, saveOperatingHours } = require('../models/operatingHoursModel');

const getHours = async (req, res) => {
  const clinicId = req.params.id;
  try {
    const hours = await getOperatingHours(clinicId);
    res.json({ hours });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch operating hours' });
  }
};

const updateHours = async (req, res) => {
  const clinicId = req.params.id;
  const { hours } = req.body;

  if (!hours || !Array.isArray(hours)) {
    return res.status(400).json({ error: 'Hours array is required' });
  }

  try {
    const result = await saveOperatingHours(clinicId, hours);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save operating hours' });
  }
};

module.exports = { getHours, updateHours };