const express = require("express");
const router = express.Router();
const tourController = require("../controllers/tourController");
const { verifyToken, isAdmin } = require("../middlewares/auth");
const { validateTour } = require("../middlewares/validation/tour");
const upload = require("../middlewares/upload");

// Public routes - Không cần đăng nhập
router.get("/", tourController.getAllTours);
router.get("/search", tourController.searchTours);
router.get("/region/:region", tourController.getToursByRegion);
router.get("/:id", tourController.getTourById);

// Admin routes - Cần đăng nhập + quyền admin
// Thêm middleware upload.single("image") để xử lý upload file ảnh
router.post("/", verifyToken, isAdmin, upload.single("image"), validateTour, tourController.createTour);
router.put("/:id", verifyToken, isAdmin, upload.single("image"), validateTour, tourController.updateTour);
router.delete("/:id", verifyToken, isAdmin, tourController.deleteTour);

module.exports = router;
