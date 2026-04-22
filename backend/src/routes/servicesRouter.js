const express = require("express");
const router = express.Router();
const servicesController = require("../controllers/servicesController");
const { verifyToken, isTourStaff } = require("../middlewares/auth");

router.get("/", verifyToken, isTourStaff, servicesController.getAllServices);
router.get("/:id", verifyToken, isTourStaff, servicesController.getServiceById);
router.post("/", verifyToken, isTourStaff, servicesController.createService);
router.put("/:id", verifyToken, isTourStaff, servicesController.updateService);
router.delete("/:id", verifyToken, isTourStaff, servicesController.deleteService);

module.exports = router;
