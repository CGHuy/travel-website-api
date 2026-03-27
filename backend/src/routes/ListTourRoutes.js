const express = require("express");
const router = express.Router();
const listTourController = require("../controllers/ListTourController");

// Route để lấy danh sách tour
router.get("/", listTourController.getAllTours);

module.exports = router;