// Validation cho tao booking
const validateBooking = (req, res, next) => {
  const { tour_id, booking_date, number_of_people } = req.body;
  const errors = [];

  if (!tour_id || isNaN(tour_id)) {
    errors.push('ID tour không hợp lệ');
  }

  if (!booking_date) {
    errors.push('Ngày đặt tour không được để trống');
  } else {
    const bookingDate = new Date(booking_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      errors.push('Ngày đặt tour phải từ hôm nay trở đi');
    }
  }

  if (!number_of_people || isNaN(number_of_people) || number_of_people <= 0) {
    errors.push('Số người phải là số dương');
  } else if (number_of_people > 50) {
    errors.push('Số người không được vượt quá 50');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors
    });
  }

  next();
};

module.exports = {
  validateBooking
};