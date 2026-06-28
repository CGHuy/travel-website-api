(() => {
    const form = document.getElementById("loginForm");
    const message = document.getElementById("loginMessage");

    const username = document.getElementById("username");
    const password = document.getElementById("password");

    const usernameError = document.getElementById("usernameError");
    const passwordError = document.getElementById("passwordError");

    const toggleBtn = document.getElementById("togglePwd");
    const API_URL = "http://localhost:3000/api";

    if (!form || !username || !password || !message || !toggleBtn || !API_URL) {
        return;
    }

    // Xử lý submit form
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        // Kiểm tra dữ liệu trước khi gửi request
        if (!validateForm()) {
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username.value.trim(),
                    password: password.value.trim(),
                }),
            });

            const data = await response.json();

            // SUCCESS
            if (response.ok && data.success) {
                message.textContent = data.message;
                message.className = "alert alert-success";

                localStorage.setItem("token", data.data.token);
                localStorage.setItem("user", JSON.stringify(data.data.user));

                setTimeout(() => {
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectUrl = urlParams.get('redirect');
                    if (redirectUrl) {
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = "/pages/index.html";
                    }
                }, 1000);
                return;
            }

            // ERROR
            message.textContent = data.message;
            message.className = "alert alert-danger";
            if (submitBtn) submitBtn.disabled = false;
        } catch (error) {
            console.error("Login error:", error);
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

    const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isValidPhone = (value) => /^0\d{9}$/.test(value);

    // Kiểm tra dữ liệu form
    const validateForm = () => {
        let isValid = true;

        clearError(username, usernameError);
        clearError(password, passwordError);

        const usernameValue = username.value.trim();
        const passwordValue = password.value.trim();

        // Kiểm tra username
        if (!usernameValue) {
            setError(username, usernameError, "Vui lòng nhập email/sdt");
            isValid = false;
        } else if (!isValidEmail(usernameValue) && !isValidPhone(usernameValue)) {
            setError(username, usernameError, "Vui lòng nhập đúng email hoặc số điện thoại");
            isValid = false;
        }

        // Kiểm tra password
        if (!passwordValue) {
            setError(password, passwordError, "Vui lòng nhập mật khẩu");
            isValid = false;
        } else if (passwordValue.length < 6 || passwordValue.length > 20) {
            setError(password, passwordError, "Mật khẩu phải có từ 6 đến 20 ký tự");
            isValid = false;
        }

        return isValid;
    };

    const clearError = (input, error) => {
        input.classList.remove("is-invalid");
        if (error) {
            error.textContent = "";
            error.classList.add("d-none");
        }
    };

    const setError = (input, error, message) => {
        input.classList.add("is-invalid");
        if (error) {
            error.textContent = message;
            error.classList.remove("d-none");
        }
    };

    // Check input real-time

    username.addEventListener("input", () => {
        const value = username.value.trim();
        if (!value) {
            setError(username, usernameError, "Vui lòng nhập email/sdt");
        } else if (!isValidEmail(value) && !isValidPhone(value)) {
            setError(username, usernameError, "Vui lòng nhập đúng email hoặc số điện thoại");
        } else {
            clearError(username, usernameError);
        }
    });

    password.addEventListener("input", () => {
        const value = password.value.trim();
        if (!value) {
            setError(password, passwordError, "Vui lòng nhập mật khẩu");
        } else if (value.length < 6 || value.length > 20) {
            setError(password, passwordError, "Mật khẩu phải có từ 6 đến 20 ký tự");
        } else {
            clearError(password, passwordError);
        }
    });
})();
