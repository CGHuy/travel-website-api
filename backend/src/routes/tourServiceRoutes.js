const express = require("express");
const router = express.Router();
const controller = require("../controllers/tourServiceController");
const { verifyToken, isTourStaff } = require("../middlewares/auth");

router.get("/tours", verifyToken, isTourStaff, controller.getToursForServiceManagement);
router.get("/:tourId", verifyToken, isTourStaff, controller.getServicesByTourId);
router.put("/:tourId", verifyToken, isTourStaff, controller.updateTourServices);

module.exports = router;
