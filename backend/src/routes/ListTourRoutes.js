const express = require("express");
const router = express.Router();
const listTourController = require("../controllers/ListTourController");
const {
	verifyToken,
	isUser,
} = require("../middlewares/auth");

// Route để lấy danh sách tour
router.get("/", listTourController.getAllTours);

// Route để lấy danh sách dịch vụ (cho bộ lọc)
router.get("/services", listTourController.getServices);

// Route để lấy chi tiết tour
router.get("/:id", listTourController.getDetailTour);

//Route để lấy thông tin tour và các ngày khởi hành còn trống chỗ
router.get("/tour-departures/:id", verifyToken, isUser,listTourController.getTourandDepartures);


module.exports = router;