const isEmptyString = (value) => value === undefined || value === null || value.toString().trim().length === 0;
const isPositiveInteger = (value) => Number.isInteger(Number(value)) && Number(value) > 0;
const isNonNegativeInteger = (value) => Number.isInteger(Number(value)) && Number(value) >= 0;
const isNonNegativeNumber = (value) => !Number.isNaN(Number(value)) && Number(value) >= 0;

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

	if (isEmptyString(tour_id)) {
		errors.tour_id = "Tour ID không được để trống";
	} else if (!isPositiveInteger(tour_id)) {
		errors.tour_id = "Tour ID phải là số nguyên dương";
	}

	if (isEmptyString(departure_location)) {
		errors.departure_location = "Địa điểm khởi hành không được để trống";
	}

	if (isEmptyString(departure_date)) {
		errors.departure_date = "Ngày khởi hành không được để trống";
	} else {
		const date = new Date(departure_date);
		if (Number.isNaN(date.getTime())) {
			errors.departure_date = "Ngày khởi hành không hợp lệ";
		}
	}

	if (isEmptyString(price_moving)) {
		errors.price_moving = "Giá vé người lớn không được để trống";
	} else if (!isNonNegativeNumber(price_moving)) {
		errors.price_moving = "Giá vé người lớn phải là số lớn hơn hoặc bằng 0";
	}

	if (isEmptyString(price_moving_child)) {
		errors.price_moving_child = "Giá vé trẻ em không được để trống";
	} else if (!isNonNegativeNumber(price_moving_child)) {
		errors.price_moving_child = "Giá vé trẻ em phải là số lớn hơn hoặc bằng 0";
	}

	if (isEmptyString(seats_total)) {
		errors.seats_total = "Tổng số chỗ không được để trống";
	} else if (!isPositiveInteger(seats_total)) {
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

const validateUpdateDeparture = (req, res, next) => {
	const {
		tour_id,
		departure_location,
		departure_date,
		price_moving,
		price_moving_child,
		seats_total,
		seats_available,
	} = req.body;

	const errors = {};

	if (Object.keys(req.body).length === 0) {
		return res.status(400).json({
			success: false,
			message: "Chưa có dữ liệu để cập nhật",
			errors,
		});
	}

	if (tour_id !== undefined && !isPositiveInteger(tour_id)) {
		errors.tour_id = "Tour ID phải là số nguyên dương";
	}

	if (departure_location !== undefined && isEmptyString(departure_location)) {
		errors.departure_location = "Địa điểm khởi hành không được để trống";
	}

	if (departure_date !== undefined) {
		if (isEmptyString(departure_date)) {
			errors.departure_date = "Ngày khởi hành không được để trống";
		} else {
			const date = new Date(departure_date);
			if (Number.isNaN(date.getTime())) {
				errors.departure_date = "Ngày khởi hành không hợp lệ";
			}
		}
	}

	if (price_moving !== undefined && !isNonNegativeNumber(price_moving)) {
		errors.price_moving = "Giá vé người lớn phải là số lớn hơn hoặc bằng 0";
	}

	if (price_moving_child !== undefined && !isNonNegativeNumber(price_moving_child)) {
		errors.price_moving_child = "Giá vé trẻ em phải là số lớn hơn hoặc bằng 0";
	}

	if (seats_total !== undefined && !isPositiveInteger(seats_total)) {
		errors.seats_total = "Tổng số chỗ phải là số nguyên dương";
	}

	if (seats_available !== undefined && !isNonNegativeInteger(seats_available)) {
		errors.seats_available = "Số chỗ trống phải là số nguyên lớn hơn hoặc bằng 0";
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

const validateUpdateDepartureStatus = (req, res, next) => {
	const { status } = req.body;
	const validStatuses = ["open", "closed", "full"];
	const errors = {};

	if (isEmptyString(status)) {
		errors.status = "Trạng thái không được để trống";
	} else if (!validStatuses.includes(status)) {
		errors.status = "Trạng thái không hợp lệ";
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

const validateUpdateDepartureSeats = (req, res, next) => {
	const { seatsChange } = req.body;
	const errors = {};

	if (seatsChange === undefined || seatsChange === null || seatsChange.toString().trim().length === 0) {
		errors.seatsChange = "Giá trị thay đổi chỗ ngồi không được để trống";
	} else if (!Number.isInteger(Number(seatsChange))) {
		errors.seatsChange = "Giá trị thay đổi chỗ ngồi phải là số nguyên";
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

const validateUpdateDeparturePrice = (req, res, next) => {
	const { price_moving, price_moving_child } = req.body;
	const errors = {};

	if (price_moving === undefined || price_moving === null || price_moving.toString().trim().length === 0) {
		errors.price_moving = "Giá vé người lớn không được để trống";
	} else if (!isNonNegativeNumber(price_moving)) {
		errors.price_moving = "Giá vé người lớn phải là số lớn hơn hoặc bằng 0";
	}

	if (price_moving_child === undefined || price_moving_child === null || price_moving_child.toString().trim().length === 0) {
		errors.price_moving_child = "Giá vé trẻ em không được để trống";
	} else if (!isNonNegativeNumber(price_moving_child)) {
		errors.price_moving_child = "Giá vé trẻ em phải là số lớn hơn hoặc bằng 0";
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
	validateUpdateDeparture,
	validateUpdateDepartureStatus,
	validateUpdateDepartureSeats,
	validateUpdateDeparturePrice,
};