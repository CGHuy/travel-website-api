(() => {
     const form = document.getElementById('loginForm');
     const message = document.getElementById('loginMessage');

     const username = document.getElementById('username');
     const password = document.getElementById('password');
     const usernameError = document.getElementById('usernameError');
     const passwordError = document.getElementById('passwordError');

     const toggleBtn = document.getElementById('togglePwd');
     const API_URL = 'http://localhost:3000/api';

     if (!form || !username || !password || !message || !toggleBtn || !API_URL) {
          return;
     }

     // Kiểm tra dữ liệu form
     const validateForm = () => {
          let isValid = true;
          username.classList.remove('is-invalid');
          password.classList.remove('is-invalid');

          if (usernameError) usernameError.textContent = '';
          if (passwordError) passwordError.textContent = '';

          // Kiểm tra username
          if (!username.value.trim()) {
               username.classList.add('is-invalid');
               if (usernameError) {
                    usernameError.textContent = 'Vui lòng nhập tên đăng nhập';
                    usernameError.classList.remove('d-none');
               }
               isValid = false;
          }

          // Kiểm tra password
          if (!password.value.trim()) {
               password.classList.add('is-invalid');
               if (passwordError) {
                    passwordError.textContent = 'Vui lòng nhập mật khẩu';
                    passwordError.classList.remove('d-none');
               }
               isValid = false;
          }

          return isValid;
     };

     // Xử lý submit form
     form.addEventListener('submit', async (event) => {
          event.preventDefault();

          //message.classList.add('d-none');

          // Kiểm tra dữ liệu trước khi gửi request
          if (!validateForm()) {
               return;
          }

          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;

          try {
               const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                         username: username.value.trim(),
                         password: password.value.trim()
                    })
               });

               const data = await response.json();

               // SUCCESS
               if (response.ok && data.success) {
                    message.textContent = data.message;
                    message.className = 'alert alert-success';

                    localStorage.setItem('token', data.data.token);
                    localStorage.setItem('user', JSON.stringify(data.data.user));

                    setTimeout(() => {
                         window.location.href = '/pages/index.html';
                    }, 1000);
                    return;
               }

               // ERROR
               message.textContent = data.message;
               message.className = 'alert alert-danger';

               if (submitBtn) submitBtn.disabled = false;

          } catch (error) {
               console.error('Login error:', error);
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

     // Check input username real-time
     username.addEventListener('input', () => {
          const value = username.value.trim();
          
          if (!value) {
               username.classList.add('is-invalid');
               if (usernameError) {
                    usernameError.textContent = 'Vui lòng nhập tên đăng nhập';
                    usernameError.classList.remove('d-none');
               }
          } else {
               username.classList.remove('is-invalid');
               if (usernameError) {
                    usernameError.textContent = '';
                    usernameError.classList.add('d-none');
               }
          }
     });

     // Check input password real-time
     password.addEventListener('input', () => {
          const value = password.value.trim();
          
          if (!value) {
               password.classList.add('is-invalid');
               if (passwordError) {
                    passwordError.textContent = 'Vui lòng nhập mật khẩu';
                    passwordError.classList.remove('d-none');
               }
          } else {
               password.classList.remove('is-invalid');
               if (passwordError) {
                    passwordError.textContent = '';
                    passwordError.classList.add('d-none');
               }
          }
     });

})();