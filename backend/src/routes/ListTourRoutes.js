const express = require("express");
const router = express.Router();
const listTourController = require("../controllers/ListTourController");

// Route để lấy danh sách tour
router.get("/", listTourController.getAllTours);

// Route để lấy danh sách dịch vụ (cho bộ lọc)
router.get("/services", listTourController.getServices);



module.exports = router;