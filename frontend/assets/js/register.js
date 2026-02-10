(() => {
     const form = document.getElementById('registerForm');
     const message = document.getElementById('registerMessage');

     const fullname = document.getElementById('fullname');
     const phone = document.getElementById('phone');
     const email = document.getElementById('email');
     const password = document.getElementById('password');

     const fullnameError = document.getElementById('fullnameError');
     const phoneError = document.getElementById('phoneError');
     const emailError = document.getElementById('emailError');
     const passwordError = document.getElementById('passwordError');

     const toggleBtn = document.getElementById('togglePwd');
     const API_URL = 'http://localhost:3000/api';

     // Nếu thiếu element quan trọng → thoát
     if (!form || !message || !toggleBtn || !fullname || !phone || !email || !password || !API_URL) {
          return;
     }

     // Xử lý submit form
     form.addEventListener('submit', async (event) => {
          event.preventDefault();

          if (!validateForm()) {
               return;
          }

          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;

          try {
               const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                         fullname: fullname.value.trim(),
                         phone: phone.value.trim(),
                         email: email.value.trim(),
                         password: password.value.trim()
                    })
               });

               const result = await response.json();
               
               // SUCCESS
               if (response.ok && result.success) {
                    message.textContent = result.message;
                    message.className = 'alert alert-success';

                    setTimeout(() => {
                         window.location.href = 'login.html';
                    }, 1000);
                    return;
               }

               // ERROR
               message.textContent = result.message;
               message.className = 'alert alert-danger';
               if (submitBtn) submitBtn.disabled = false;

          } catch (error) {
               console.error('Registration error:', error);
               message.textContent = 'Không thể kết nối tới server';
               message.className = 'alert alert-danger';
               if (submitBtn) submitBtn.disabled = false;
          }
     });

     // Ẩn/hiện mật khẩu
     toggleBtn.addEventListener('click', () => {
          const isHidden = password.type === 'password';
          password.type = isHidden ? 'text' : 'password';
          toggleBtn.textContent = isHidden ? 'Ẩn' : 'Hiện';
     });

     // Kiểm tra dữ liệu form
     const validateForm = () => {
          let isValid = true;

          clearError(fullname, fullnameError);
          clearError(phone, phoneError);
          clearError(email, emailError);
          clearError(password, passwordError);

          if (!fullname.value.trim()) {
               setError(fullname, fullnameError, 'Vui lòng nhập họ và tên');
               isValid = false;
          }

          if (!phone.value.trim()) {
               setError(phone, phoneError, 'Vui lòng nhập số điện thoại');
               isValid = false;
          } else if (!/^0/.test(phone.value.trim())) {
               setError(phone, phoneError, 'Số điện thoại bắt đầu bằng 0');
               isValid = false;
          } else if (!/^0\d{9}$/.test(phone.value.trim())) {
               setError(phone, phoneError, 'Số điện thoại phải có đúng 10 chữ số');
               isValid = false;
          }

          if (!email.value.trim()) {
               setError(email, emailError, 'Vui lòng nhập email');
               isValid = false;
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
               setError(email, emailError, 'Email chưa đúng định dạng');
               isValid = false;
          }

          if (!password.value.trim()) {
               setError(password, passwordError, 'Vui lòng nhập mật khẩu');
               isValid = false;
          } else if (password.value.trim().length < 6) {
               setError(password, passwordError, 'Mật khẩu phải có ít nhất 6 ký tự');
               isValid = false;
          }

          return isValid;
     };

     const setError = (input, error, text) => {
          if (input) input.classList.add('is-invalid');
          if (error) {
               error.textContent = text;
               error.classList.remove('d-none');
          }
     };

     const clearError = (input, error) => {
          if (input) input.classList.remove('is-invalid');
          if (error) {
               input.classList.add('is-valid');
               error.textContent = '';
               error.classList.add('d-none');
          }
     };

     // Check input real-time

     fullname.addEventListener('input', () => {
          const value = fullname.value.trim();
          if (!value) {
               setError(fullname, fullnameError, 'Vui lòng nhập họ và tên');
          } else {
               clearError(fullname, fullnameError);
          }
     });

     phone.addEventListener('input', () => {
          const value = phone.value.trim();
          if (!value) {
               setError(phone, phoneError, 'Vui lòng nhập số điện thoại');
          } else if (!/^0/.test(value)) {
               setError(phone, phoneError, 'Số điện thoại phải bắt đầu bằng 0');
          } else if (!/^0\d{9}$/.test(value)) {
               setError(phone, phoneError, 'Số điện thoại phải có đúng 10 chữ số');
          } else {
               clearError(phone, phoneError);
          }
     });

     email.addEventListener('input', () => {
          const value = email.value.trim();
          if (!value) {
               setError(email, emailError, 'Vui lòng nhập email');
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
               setError(email, emailError, 'Email chưa đúng định dạng');
          } else {
               clearError(email, emailError);
          }
     });

     password.addEventListener('input', () => {
          const value = password.value.trim();
          if (!value) {
               setError(password, passwordError, 'Vui lòng nhập mật khẩu');
          } else if (value.length < 6) {
               setError(password, passwordError, 'Mật khẩu phải có ít nhất 6 ký tự');
          } else {
               clearError(password, passwordError);
          }
     });
})();
