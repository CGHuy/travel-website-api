(() => {
    const form = document.getElementById("registerForm");
    const message = document.getElementById("registerMessage");

    const fullname = document.getElementById("fullname");
    const phone = document.getElementById("phone");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");

    const fullnameError = document.getElementById("fullnameError");
    const phoneError = document.getElementById("phoneError");
    const emailError = document.getElementById("emailError");
    const passwordError = document.getElementById("passwordError");
    const confirmPasswordError = document.getElementById("confirmPasswordError");

    const toggleBtn = document.getElementById("togglePwd");
    const API_URL = "http://localhost:3000/api";

    // Nếu thiếu element quan trọng → thoát
    if (!form || !message || !toggleBtn || !fullname || !phone || !email || !password || !confirmPassword || !API_URL) {
        return;
    }

    const validateFullname = () => {
        const value = fullname.value.trim();
        if (!value) return "Vui lòng nhập họ và tên";
        if (value.length < 3) return "Họ và tên phải có ít nhất 3 ký tự";
        if (value.length > 20) return "Họ và tên không được vượt quá 20 ký tự";
        if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(value)) return "Họ và tên chỉ được chứa chữ cái và khoảng trắng";
        return "";
    };

    const validatePhone = () => {
        const value = phone.value.trim();
        if (!value) return "Vui lòng nhập số điện thoại";
        if (!/^0/.test(value)) return "Số điện thoại bắt đầu bằng 0";
        if (!/^0\d{9}$/.test(value)) return "Số điện thoại phải có đúng 10 chữ số";
        return "";
    };

    const validateEmail = () => {
        const value = email.value.trim();
        if (!value) return "Vui lòng nhập email";
        if (value.length < 6) return "Email phải có ít nhất 6 ký tự";
        if (value.length > 50) return "Email không được vượt quá 50 ký tự";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email chưa đúng định dạng";
        return "";
    };

    const validatePassword = () => {
        const value = password.value.trim();
        if (!value) return "Vui lòng nhập mật khẩu";
        if (value.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
        if (value.length > 20) return "Mật khẩu không được vượt quá 20 ký tự";
        return "";
    };

    const validateConfirmPassword = () => {
        const value = confirmPassword.value.trim();
        if (!value) return "Vui lòng xác nhận mật khẩu";
        if (value !== password.value.trim()) return "Mật khẩu xác nhận không khớp";
        return "";
    };

    const validateField = (field) => {
        let errorText = "";
        let errorEl = null;

        if (field === fullname) {
            errorText = validateFullname();
            errorEl = fullnameError;
        } else if (field === phone) {
            errorText = validatePhone();
            errorEl = phoneError;
        } else if (field === email) {
            errorText = validateEmail();
            errorEl = emailError;
        } else if (field === password) {
            errorText = validatePassword();
            errorEl = passwordError;
        } else if (field === confirmPassword) {
            errorText = validateConfirmPassword();
            errorEl = confirmPasswordError;
        }

        if (!errorEl) return true;

        if (errorText) {
            setError(field, errorEl, errorText);
            return false;
        }

        clearError(field, errorEl);
        return true;
    };

    [fullname, phone, email, password, confirmPassword].forEach((field) => {
        field.addEventListener("input", () => {
            validateField(field);
            if (field === password && confirmPassword.value.trim()) {
                validateField(confirmPassword);
            }
        });

        field.addEventListener("blur", () => {
            validateField(field);
        });
    });

    // Xử lý submit form
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullname: fullname.value.trim(),
                    phone: phone.value.trim(),
                    email: email.value.trim(),
                    password: password.value.trim(),
                    confirmPassword: confirmPassword.value.trim(),
                }),
            });

            const result = await response.json();

            // SUCCESS
            if (response.ok && result.success) {
                const token = result?.data?.token;
                const user = result?.data?.user;

                if (token && user) {
                    localStorage.setItem("token", token);
                    localStorage.setItem("user", JSON.stringify(user));

                    message.textContent = "Đăng ký và đăng nhập thành công";
                    message.className = "alert alert-success";

                    setTimeout(() => {
                        window.location.href = "../index.html";
                    }, 800);
                    return;
                }

                // Fallback nếu backend không trả token/user trong response đăng ký
                message.textContent = "Đăng ký thành công, vui lòng đăng nhập";
                message.className = "alert alert-warning";
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1000);
                return;
            }

            // ERROR
            message.textContent = result.message;
            message.className = "alert alert-danger";
            if (submitBtn) submitBtn.disabled = false;
        } catch (error) {
            console.error("Registration error:", error);
            message.textContent = "Không thể kết nối tới server";
            message.className = "alert alert-danger";
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    // Ẩn/hiện mật khẩu
    toggleBtn.addEventListener("click", () => {
        const isHidden = password.type === "password";
        password.type = isHidden ? "text" : "password";
        toggleBtn.textContent = isHidden ? "Ẩn" : "Hiện";
    });

    const validateForm = () => {
        const isFullnameValid = validateField(fullname);
        const isPhoneValid = validateField(phone);
        const isEmailValid = validateField(email);
        const isPasswordValid = validateField(password);
        const isConfirmPasswordValid = validateField(confirmPassword);

        return isFullnameValid && isPhoneValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;
    };

    const setError = (input, error, text) => {
        if (input) input.classList.add("is-invalid");
        if (error) {
            error.textContent = text;
            error.classList.remove("d-none");
        }
    };

    const clearError = (input, error) => {
        if (input) input.classList.remove("is-invalid");
        if (error) {
            if (input && input.value.trim()) {
                input.classList.add("is-valid");
            } else if (input) {
                input.classList.remove("is-valid");
            }
            error.textContent = "";
            error.classList.add("d-none");
        }
    };
})();
