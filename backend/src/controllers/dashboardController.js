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

// POST /api/queue/add-walkin
const addWalkInPatient = async (req, res) => {
  console.log("ADD WALK-IN HIT"); //  check error
  console.log("BODY:", req.body); //  check error

  const { first_name, last_name, email, clinic_id } = req.body;

  try {
    const result = await dashboardModel.addWalkInPatient(
      first_name,
      last_name,
      email,
      clinic_id
    );

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add patient" });
  }
};

module.exports = {
  getQueue,
  updateStatus,
  addWalkInPatient
};