const dashboardModel =
  require('../models/dashboardModel');

/* GET QUEUE */

// Get queue data
const getQueue = async (req, res) => {

  try {

    const clinicId =
      req.query.clinic_id;

    console.log(
      "CLINIC ID RECEIVED BY DASHBOARD:",
      clinicId
    );

    // Check clinic id
    if (!clinicId) {

      return res.status(400).json({
        error: "clinic_id is required"
      });
    }

    // Get queue patients
    const data =
      await dashboardModel.getQueuePatients(
        clinicId
      );

    res.json(data);

  } catch (error) {

    console.error(
      "Error fetching queue:",
      error
    );

    res.status(500).json({
      error: "Server error"
    });
  }
};

/* GET CLINICS */

// Get clinic details
const getClinics = async (req, res) => {

  try {

    const clinicId =
      req.query.clinic_id;

    // Check clinic id
    if (!clinicId) {

      return res.status(400).json({
        error: "clinic_id is required"
      });
    }

    // Get clinic data
    const clinics =
      await dashboardModel.getClinics(
        clinicId
      );

    res.json(clinics);

  } catch (error) {

    console.error(
      "Error fetching clinics:",
      error
    );

    res.status(500).json({
      error: "Failed to fetch clinics"
    });
  }
};

/* UPDATE STATUS */

// Update queue status
const updateStatus = async (
  req,
  res
) => {

  const { id } =
    req.params;

  const { status } =
    req.body;

  try {

    const updated =
      await dashboardModel.updateQueueStatus(
        id,
        status
      );

    res.json(updated);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Update failed"
    });
  }
};

/* ADD WALK-IN */

// Add new patient
const addWalkInPatient = async (
  req,
  res
) => {

  console.log("ADD WALK-IN HIT");

  console.log(
    "BODY:",
    req.body
  );

  const {
    first_name,
    last_name,
    email,
    clinic_id,
    phone_number
  } = req.body;

  try {

    const result =
      await dashboardModel.addWalkInPatient(
        first_name,
        last_name,
        email,
        clinic_id,
        phone_number
      );

    res.json(result);

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Failed to add patient"
    });
  }
};

/* DELETE PATIENT */

// Remove patient from queue
const deleteQueuePatient = async (
  req,
  res
) => {

  const { id } =
    req.params;

  try {

    const deleted =
      await dashboardModel.deleteQueuePatient(
        id
      );

    // Check if patient exists
    if (!deleted) {

      return res.status(404).json({
        error:
          "Queue patient not found"
      });
    }

    res.json({
      message:
        "Patient removed from queue",
      deleted
    });

  } catch (error) {

    console.error(
      "Error deleting queue patient:",
      error
    );

    res.status(500).json({
      error:
        error.message ||
        "Failed to add patient"
    });
  }
};

/* GET APPOINTMENTS */

// Get future appointments
const getUpcomingAppointments =
  async (req, res) => {

    try {

      const clinicId =
        req.query.clinic_id;

      const appointments =
        await dashboardModel.getUpcomingAppointments(
          clinicId
        );

      res.json(appointments);

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error:
          "Failed to fetch appointments"
      });
    }
  };

/* RESCHEDULE APPOINTMENT */

// Update appointment
const rescheduleAppointment =
  async (req, res) => {

    try {

      const { id } =
        req.params;

      const {
        appointment_date,
        appointment_time
      } = req.body;

      // Update appointment
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
        error:
          "Failed to reschedule appointment"
      });
    }
  };

module.exports = {
  getQueue,
  updateStatus,
  addWalkInPatient,
  getClinics,
  deleteQueuePatient,
  getUpcomingAppointments,
  rescheduleAppointment
};