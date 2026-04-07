const db = require("../config/database");
const Departure = require("../models/Departure");

// Tạo departure mới
exports.createDeparture = async (req, res) => {
	try {
		const departureId = await Departure.create(req.body);
		return res.status(201).json({
			success: true,
			message: "Tạo điểm khởi hành thành công!",
			data: { id: departureId },
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi tạo điểm khởi hành",
			error: error.message,
		});
	}
};

// Lấy tất cả departures
exports.getAllDepartures = async (req, res) => {
	try {
		const departures = await Departure.getAll();
		return res.json({
			success: true,
			message: "Lấy danh sách điểm khởi hành thành công!",
			data: departures,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi lấy danh sách điểm khởi hành",
			error: error.message,
		});
	}
};

// Lấy departure theo ID
exports.getDepartureById = async (req, res) => {
	try {
		const { id } = req.params;
		const departure = await Departure.getById(id);
		if (!departure) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy điểm khởi hành",
			});
		}
		return res.json({
			success: true,
			message: "Lấy điểm khởi hành thành công!",
			data: departure,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi lấy điểm khởi hành",
			error: error.message,
		});
	}
};

// Cập nhật trạng thái departure
exports.updateDepartureStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		const success = await Departure.updateStatus(id, status);
		if (!success) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy điểm khởi hành để cập nhật",
			});
		}
		return res.json({
		success: true,
		message: "Cập nhật trạng thái điểm khởi hành thành công!",
	});
	} catch (error) {
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// Xóa departure
exports.deleteDeparture = async (req, res) => {
	try {
		const { id } = req.params;
		const success = await Departure.delete(id);
		if (!success) {
			return res.status(400).json({
				success: false,
				message: "Không thể xóa điểm khởi hành hoặc điểm khởi hành không tồn tại",
			});
		}
		return res.json({
			success: true,
			message: "Xóa điểm khởi hành thành công!",
		});
	} catch (error) {
		return res.status(400).json({
			success: false,
			message: error.message,
		});
	}
};

// Tìm kiếm departures theo nhiều tiêu chí
exports.searchDepartures = async (req, res) => {
	try {
		const { id, tour_id, departure_location, departure_date, status } = req.query;
		const filters = {};

		if (id) filters.id = id;
		if (tour_id) filters.tour_id = tour_id;
		if (departure_location) filters.departure_location = departure_location;
		if (departure_date) filters.departure_date = departure_date;
		if (status) filters.status = status;

		const departures = await Departure.searchDepartures(filters);
		return res.json({
			success: true,
			message: "Tìm kiếm điểm khởi hành thành công!",
			data: departures,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Lỗi khi tìm kiếm điểm khởi hành",
			error: error.message,
		});
	}
};



