const express = require("express");
const router = express.Router();
const listTourController = require("../controllers/ListTourController");

// Route để lấy danh sách tour
router.get("/", listTourController.getAllTours);

// Route để truy cập giao diện danh sách tour
router.get("/view", listTourController.renderListPage);


module.exports = router;