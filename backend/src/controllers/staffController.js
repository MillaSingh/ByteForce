const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const staffModel = require('../models/staffModel');

const getStaff = async (req, res) => {
  const { clinicId } = req.params;
  try {
    const staff = await staffModel.getStaffByClinic(clinicId);
    res.json({ staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
};

const createStaff = async (req, res) => {
  const { firstName, lastName, email, password, jobTitle, specialties, clinicId } = req.body;

  if (!firstName || !lastName || !email || !password || !jobTitle || !clinicId) {
    return res.status(400).json({ error: 'All required fields must be provided' });
  }

  try {
    // Check if email already exists in PostgreSQL
    const emailExists = await staffModel.checkEmailExists(email);
    if (emailExists) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Create Firebase account using Admin SDK
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`
    });

    // Hash password for PostgreSQL
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and staff_profile in PostgreSQL using transaction
    await staffModel.createStaffUser(
      firstName,
      lastName,
      email,
      firebaseUser.uid,
      passwordHash,
      jobTitle,
      specialties,
      clinicId
    );

    res.json({ success: true, message: 'Staff account created successfully' });

  } catch (err) {
    console.error('Create staff error:', err);

    // If Firebase account was created but PostgreSQL failed, delete Firebase account
    if (err.firebaseUid) {
      try {
        await admin.auth().deleteUser(err.firebaseUid);
      } catch (cleanupErr) {
        console.error('Failed to clean up Firebase account:', cleanupErr);
      }
    }

    res.status(500).json({ error: err.message || 'Failed to create staff account' });
  }
};

const unassignStaff = async (req, res) => {
  const { staffProfileId, clinicId } = req.params;
  try {
    const result = await staffModel.unassignStaff(staffProfileId, clinicId);
    if (result.updatedRow === 0) {
      return res.status(404).json({ error: 'Staff member not found at this clinic' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to unassign staff member' });
  }
};

module.exports = { getStaff, createStaff, unassignStaff };