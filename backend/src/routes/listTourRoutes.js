const express = require("express");
const router = express.Router();
const listTourController = require("../controllers/listTourController");
const { verifyToken, isUser } = require("../middlewares/auth");
const { searchLimiter } = require("../middlewares/rateLimiter");

// 1. Công khai (không cần login)
router.get("/", searchLimiter, listTourController.getAllTours);

// Route để lấy danh sách dịch vụ (cho bộ lọc)
router.get("/services", listTourController.getServices);

// 2. Bảo mật (cần login)
router.get("/wishlist/all", verifyToken, isUser, listTourController.getWishListByUser);

// Route để lấy chi tiết tour
router.get("/:id", listTourController.getDetailTour);

//Route để lấy thông tin tour và các ngày khởi hành còn trống chỗ
router.get(
	"/tour-departures/:id",
	verifyToken,
	isUser,
	listTourController.getTourandDepartures,
);

//Route thêm tour vào wishlist
router.post(
	"/wishlist/:id",
	verifyToken,
	isUser,
	listTourController.addWishList,
);

//Kiểm tra tour đã nằm trong wishlist chưa
router.get("/wishlist/:id", verifyToken, isUser, listTourController.checkWishList);

//Xóa tour khỏi wishlist
router.delete("/wishlist/:id", verifyToken, isUser, listTourController.removeWishList);

//Nhận yêu cầu người dùng để gợi ý Tour
router.post("/suggestions",searchLimiter,listTourController.getTourSuggestions);

module.exports = router;
