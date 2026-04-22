const express = require("express");
const router = express.Router();

const { deleteAccount } = require("../controllers/authController");

router.delete("/delete-account", deleteAccount);

module.exports = router;