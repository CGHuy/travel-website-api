const express = require("express");
const router = express.Router();
const listTourController = require("../controllers/ListTourController");
const { verifyToken, isUser } = require("../middlewares/auth");

// Route để lấy danh sách tour
router.get("/", listTourController.getAllTours);

// Route để lấy danh sách dịch vụ (cho bộ lọc)
router.get("/services", listTourController.getServices);

// Route lấy toàn bộ wishlist của user hiện tại (để đánh dấu trên list tour)
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

module.exports = router;
