const express = require("express");
const router = express.Router();
const departureController = require("../controllers/departureController");
const {
	validateCreateDeparture,
	validateUpdateDeparture,
	validateUpdateDepartureStatus,
	validateUpdateDepartureSeats,
	validateUpdateDeparturePrice,
} = require("../middlewares/validation/departures");

const { verifyToken, isTourStaff } = require("../middlewares/auth");

// Tạo departure mới - Cần đăng nhập và có role admin
router.post("/", verifyToken, isTourStaff, validateCreateDeparture, departureController.createDeparture);

// Lấy tất cả departures - Cần đăng nhập và có role admin
router.get("/all", verifyToken, isTourStaff, departureController.getAllDepartures);

// Tìm kiếm departures theo nhiều tiêu chí - Cần đăng nhập và có role admin
router.get("/search", verifyToken, isTourStaff, departureController.searchDepartures);

// Lấy departure theo ID - Cần đăng nhập và có role admin
router.get("/:id", verifyToken, isTourStaff, departureController.getDepartureById);

// Cập nhật departure - Cần đăng nhập và có role admin
router.put("/:id", verifyToken, isTourStaff, validateUpdateDeparture, departureController.updateDeparture);

// Quản lý số chỗ ngồi - Cần đăng nhập và có role admin
router.put("/:id/seats", verifyToken, isTourStaff, validateUpdateDepartureSeats, departureController.updateAvailableSeats);

// Quản lý giá vé - Cần đăng nhập và có role admin
router.put("/:id/price", verifyToken, isTourStaff, validateUpdateDeparturePrice, departureController.updatePrice);

// Cập nhật trạng thái departure - Cần đăng nhập và có role admin
router.put("/:id/status", verifyToken, isTourStaff, validateUpdateDepartureStatus, departureController.updateDepartureStatus);

// Xóa departure - Cần đăng nhập và có role admin
router.delete("/:id", verifyToken, isTourStaff, departureController.deleteDeparture);

module.exports = router;
