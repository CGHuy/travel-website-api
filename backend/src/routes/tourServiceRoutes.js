const express = require("express");
const router = express.Router();
const controller = require("../controllers/tourServiceController");

router.get("/tours", controller.getToursForServiceManagement);
router.get("/:tourId", controller.getServicesByTourId);
router.put("/:tourId", controller.updateTourServices);

module.exports = router;
