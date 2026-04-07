const validateCreateDeparture = (req, res, next) => {
	const {
		tour_id,
		departure_location,
		departure_date,
		price_moving,
		price_moving_child,
		seats_total,
	} = req.body;

	const errors = {};

	if (!tour_id || tour_id.toString().trim().length === 0) {
		errors.tour_id = "Tour ID không được để trống";
	} else if (isNaN(Number(tour_id)) || Number(tour_id) <= 0) {
		errors.tour_id = "Tour ID phải là số nguyên dương";
	}

	if (!departure_location || departure_location.trim().length === 0) {
		errors.departure_location = "Địa điểm khởi hành không được để trống";
	}

	if (!departure_date || departure_date.trim().length === 0) {
		errors.departure_date = "Ngày khởi hành không được để trống";
	} else {
		const date = new Date(departure_date);
		if (Number.isNaN(date.getTime())) {
			errors.departure_date = "Ngày khởi hành không hợp lệ";
		}
	}

	if (price_moving === undefined || price_moving === null || price_moving.toString().trim().length === 0) {
		errors.price_moving = "Giá vé người lớn không được để trống";
	} else if (isNaN(Number(price_moving)) || Number(price_moving) < 0) {
		errors.price_moving = "Giá vé người lớn phải là số lớn hơn hoặc bằng 0";
	}

	if (price_moving_child === undefined || price_moving_child === null || price_moving_child.toString().trim().length === 0) {
		errors.price_moving_child = "Giá vé trẻ em không được để trống";
	} else if (isNaN(Number(price_moving_child)) || Number(price_moving_child) < 0) {
		errors.price_moving_child = "Giá vé trẻ em phải là số lớn hơn hoặc bằng 0";
	}

	if (seats_total === undefined || seats_total === null || seats_total.toString().trim().length === 0) {
		errors.seats_total = "Tổng số chỗ không được để trống";
	} else if (!Number.isInteger(Number(seats_total)) || Number(seats_total) <= 0) {
		errors.seats_total = "Tổng số chỗ phải là số nguyên dương";
	}

	if (Object.keys(errors).length > 0) {
		return res.status(400).json({
			success: false,
			message: "Dữ liệu không hợp lệ",
			errors,
		});
	}

	next();
};

module.exports = {
	validateCreateDeparture,
};