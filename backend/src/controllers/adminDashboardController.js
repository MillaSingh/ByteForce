const { getAnalytics } = require('../models/adminDashboardModel');

const getClinicAnalytics = async (req, res) => {
  const { clinicId } = req.params;
  if (!clinicId) {
    return res.status(400).json({ error: 'clinicId is required' });
  }
  try {
    const data = await getAnalytics(clinicId);
    res.json(data);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = { getClinicAnalytics };