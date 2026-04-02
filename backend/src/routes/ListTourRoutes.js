const express = require("express");
const router = express.Router();
const listTourController = require("../controllers/ListTourController");

// Route để lấy danh sách tour
router.get("/", listTourController.getAllTours);

// Route để lấy danh sách dịch vụ (cho bộ lọc)
router.get("/services", listTourController.getServices);

// Route để lấy chi tiết tour
router.get("/:id", listTourController.getDetailTour);



module.exports = router;