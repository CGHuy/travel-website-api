// Validation cho đăng ký user
const validateRegister = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  // Kiểm tra username
  if (!username || username.trim().length === 0) {
    errors.push('Tên người dùng không được để trống');
  } else if (username.length < 3) {
    errors.push('Tên người dùng phải có ít nhất 3 ký tự');
  } else if (username.length > 50) {
    errors.push('Tên người dùng không được vượt quá 50 ký tự');
  }

  // Kiểm tra email
  if (!email || email.trim().length === 0) {
    errors.push('Email không được để trống');
  } else if (email.length > 255) {
    errors.push('Email không được vượt quá 255 ký tự');
  } else {
    // Email regex theo RFC 5322 (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Email không hợp lệ');
    }
  }

  // Kiểm tra password
  if (!password || password.trim().length === 0) {
    errors.push('Mật khẩu không được để trống');
  } else if (password.length < 6) {
    errors.push('Mật khẩu phải có ít nhất 6 ký tự');
  } else if (password.length > 128) {
    errors.push('Mật khẩu không được vượt quá 128 ký tự');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors
    });
  }

  next();
};

// Validation cho đăng nhập
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || email.trim().length === 0) {
    errors.push('Email không được để trống');
  }

  if (!password || password.trim().length === 0) {
    errors.push('Mật khẩu không được để trống');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ thông tin',
      errors: errors
    });
  }

  next();
};

// Validation cho tạo/cập nhật tour
const validateTour = (req, res, next) => {
  const { name, description, price, region, duration, location } = req.body;
  const errors = [];

  if (!name || name.trim().length === 0) {
    errors.push('Tên tour không được để trống');
  } else if (name.length > 200) {
    errors.push('Tên tour không được vượt quá 200 ký tự');
  }

  if (!description || description.trim().length === 0) {
    errors.push('Mô tả không được để trống');
  } else if (description.length > 2000) {
    errors.push('Mô tả không được vượt quá 2000 ký tự');
  }

  if (!price || isNaN(price) || price <= 0) {
    errors.push('Giá tour phải là số dương');
  } else if (price > 999999999) {
    errors.push('Giá tour không được vượt quá 999,999,999');
  }

  if (!region || region.trim().length === 0) {
    errors.push('Vùng miền không được để trống');
  } else if (region.length > 100) {
    errors.push('Vùng miền không được vượt quá 100 ký tự');
  }

  if (!duration || duration.trim().length === 0) {
    errors.push('Thời gian không được để trống');
  } else if (duration.length > 100) {
    errors.push('Thời gian không được vượt quá 100 ký tự');
  }

  if (!location || location.trim().length === 0) {
    errors.push('Địa điểm không được để trống');
  } else if (location.length > 255) {
    errors.push('Địa điểm không được vượt quá 255 ký tự');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors
    });
  }

  next();
};

// Validation cho tạo booking
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
      errors: errors
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTour,
  validateBooking
};