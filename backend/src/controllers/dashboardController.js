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

const getClinics = async (req, res) => {
  try {
    const clinics = await dashboardModel.getClinics();
    res.json(clinics);
  } catch (error) {
    console.error("Error fetching clinics:", error);
    res.status(500).json({ error: "Failed to fetch clinics" });
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

  const { first_name, last_name, email, clinic_id,phone_number } = req.body;

  try {
    const result = await dashboardModel.addWalkInPatient(
      first_name,
      last_name,
      email,
      clinic_id,
      phone_number
    );

    res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add patient" });
  }
};
// DELETE /api/queue/:id
const deleteQueuePatient = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await dashboardModel.deleteQueuePatient(id);

    if (!deleted) {
      return res.status(404).json({ error: "Queue patient not found" });
    }

    res.json({
      message: "Patient removed from queue",
      deleted
    });

  } catch (error) {
    console.error("Error deleting queue patient:", error);
    res.status(500).json({ error: error.message || "Failed to add patient" });
  }
};

// PATCH /api/queue/reschedule/:id
const rescheduleAppointment = async (req, res) => {

  const { id } = req.params;

  const {
    appointment_date,
    appointment_time
  } = req.body;

  try {

    const updated =
      await dashboardModel.rescheduleAppointment(
        id,
        appointment_date,
        appointment_time
      );

    res.json(updated);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to reschedule appointment"
    });
  }
};

module.exports = {
  getQueue,
  updateStatus,
  addWalkInPatient,
  getClinics,
  deleteQueuePatient,
  rescheduleAppointment
};