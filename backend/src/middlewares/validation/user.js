// Validation cho cập nhật thông tin user
const validateUpdateProfile = (req, res, next) => {
	const { fullname, phone, email } = req.body;
	const errors = {};

	const value = (v) => (typeof v === "string" ? v.trim() : "");

	const f = value(fullname);
	if (!f) errors.fullname = "Họ và tên không được để trống";
	else if (f.length < 3) errors.fullname = "Họ và tên phải có ít nhất 3 ký tự";
	else if (f.length > 255)
		errors.fullname = "Họ và tên không được vượt quá 255 ký tự";

	const p = value(phone);
	if (!p) errors.phone = "Số điện thoại không được để trống";
	else if (!/^0[0-9]{9}$/.test(p))
		errors.phone = "Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)";

	const e = value(email);
	if (!e) errors.email = "Email không được để trống";
	else if (e.length > 255) errors.email = "Email không được vượt quá 255 ký tự";
	else {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(e)) errors.email = "Email không hợp lệ";
	}

	if (Object.keys(errors).length > 0) {
		return res
			.status(400)
			.json({ success: false, message: "Dữ liệu không hợp lệ", errors });
	}

	next();
};

// Validate đổi mật khẩu (sử dụng camelCase để nhất quán với controller)
const validateChangePassword = (req, res, next) => {
	const { currentPassword, newPassword, confirmPassword } = req.body;
	const errors = {};

	const cur = typeof currentPassword === "string" ? currentPassword.trim() : "";
	const neu = typeof newPassword === "string" ? newPassword.trim() : "";
	const conf =
		typeof confirmPassword === "string" ? confirmPassword.trim() : "";

	if (!cur) errors.currentPassword = "Mật khẩu hiện tại không được để trống";
	else if (cur.length < 6)
		errors.currentPassword = "Mật khẩu hiện tại phải có ít nhất 6 ký tự";

	if (!neu) errors.newPassword = "Mật khẩu mới không được để trống";
	else if (neu.length < 6)
		errors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
	else if (neu === cur)
		errors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";

	if (!conf) errors.confirmPassword = "Xác nhận mật khẩu không được để trống";
	else if (conf !== neu)
		errors.confirmPassword = "Xác nhận mật khẩu không khớp với mật khẩu mới";

	if (Object.keys(errors).length > 0) {
		return res
			.status(400)
			.json({ success: false, message: "Dữ liệu không hợp lệ", errors });
	}

	next();
};

// Validation cho cập nhật tai khoản user - Tuy chỉnh theo yêu cầu của admin
// Có thể thêm validate cho role, status nếu cần
const validateUpdateUser = (req, res, next) => {
	const { fullname, phone, email, role, status } = req.body;
	const errors = {};
	if (!fullname || fullname.trim().length === 0) {
		errors.fullname = "Họ và tên không được để trống";
	} else if (fullname.length < 3) {
		errors.fullname = "Họ và tên phải có ít nhất 3 ký tự";
	}
	if (!phone || phone.trim().length === 0) {
		errors.phone = "Số điện thoại không được để trống";
	} else if (!/^0[0-9]{9}$/.test(phone.trim())) {
		errors.phone = "Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0)";
	}
	if (!email || email.trim().length === 0) {
		errors.email = "Email không được để trống";
	} else if (email.length > 255) {
		errors.email = "Email không được vượt quá 255 ký tự";
	} else {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email.trim())) {
			errors.email = "Email không hợp lệ";
		}
	}
	if (!role || role.trim().length === 0) {
		errors.role = "Vai trò không được để trống";
	}
	if (!status || status.trim().length === 0) {
		errors.status = "Trạng thái không được để trống";
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
	validateUpdateProfile,
	validateChangePassword,
	validateUpdateUser,
};
