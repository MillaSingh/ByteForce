const dashboardModel = require('../models/dashboardModel');

// GET /api/queue
const getQueue = async (req, res) => {
  try {
    const data = await dashboardModel.getQueuePatients();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};


// PATCH /api/queue/:id
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updated = await dashboardModel.updateQueueStatus(id, status);
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
};

module.exports = {
  getQueue,
  updateStatus
};