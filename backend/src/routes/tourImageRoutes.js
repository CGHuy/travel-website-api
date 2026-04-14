const express = require("express");
const router = express.Router();
const tourImageController = require("../controllers/tourImageController");
const { verifyToken, isAdmin } = require("../middlewares/auth");
const mediaStorage = require("../middlewares/mediaStorage");

router.get("/tour/:tourId", tourImageController.getImagesByTourId);
router.post("/tour/:tourId", verifyToken, isAdmin, mediaStorage.single("image"), tourImageController.createTourImage);
router.delete("/:id", verifyToken, isAdmin, tourImageController.deleteTourImage);

module.exports = router;
