// Validation cho đăng ký user
const validateRegister = (req, res, next) => {
  const { fullname, phone, email, password } = req.body;
  const errors = {};

  // Kiểm tra fullname
  if (!fullname || fullname.trim().length === 0) {
    errors.fullname = 'Họ và tên không được để trống';
  } else if (fullname.length < 3) {
    errors.fullname = 'Họ và tên phải có ít nhất 3 ký tự';
  } else if (fullname.length > 255) {
    errors.fullname = 'Họ và tên không được vượt quá 255 ký tự';
  }

  // Kiểm tra phone
  if (!phone || phone.trim().length === 0) {
    errors.phone = 'Số điện thoại không được để trống';
  } else if (!/^0[0-9]{9}$/.test(phone.trim())) {
    errors.phone = 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)';
  }

  // Kiểm tra email
  if (!email || email.trim().length === 0) {
    errors.email = 'Email không được để trống';
  } else if (email.length > 255) {
    errors.email = 'Email không được vượt quá 255 ký tự';
  } else {
    // Email regex theo RFC 5322 (simplified)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Email không hợp lệ';
    }
  }

  // Kiểm tra password
  if (!password || password.trim().length === 0) {
    errors.password = 'Mật khẩu không được để trống';
  } else if (password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
  } else if (password.length > 128) {
    errors.password = 'Mật khẩu không được vượt quá 128 ký tự';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors
    });
  }

  next();
};

// Validation cho đăng nhập
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = {};

  // Kiểm tra username
  if (!username || username.trim().length === 0) {
    errors.username = 'Email hoặc số điện thoại không được để trống';
  }
  
  // Kiểm tra password
  if (!password || password.trim().length === 0) {
    errors.password = 'Mật khẩu không được để trống';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ thông tin',
      errors
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