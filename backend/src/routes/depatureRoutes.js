const express = require("express");
const router = express.Router();
const depatureController = require("../controllers/depatureController");
const { validateCreateDeparture } = require("../middlewares/validation/departures");

const { verifyToken, isAdmin } = require("../middlewares/auth");

// Tạo departure mới - Cần đăng nhập và có role admin
router.post("/", verifyToken, isAdmin, validateCreateDeparture, depatureController.createDeparture);

// Lấy tất cả departures - Cần đăng nhập và có role admin
router.get("/all", verifyToken, isAdmin, depatureController.getAllDepartures);

// Tìm kiếm departures theo nhiều tiêu chí - Cần đăng nhập và có role admin
router.get("/search", verifyToken, isAdmin, depatureController.searchDepartures);



// Cập nhật trạng thái departure - Cần đăng nhập và có role admin
router.put("/:id/status", verifyToken, isAdmin, depatureController.updateDepartureStatus);

// Xóa departure - Cần đăng nhập và có role admin
router.delete("/:id", verifyToken, isAdmin, depatureController.deleteDeparture);

module.exports = router;
