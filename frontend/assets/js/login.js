(() => {
     const form = document.getElementById('loginForm');
     const message = document.getElementById('loginMessage');
     const toggleBtn = document.getElementById('togglePwd');
     const password = document.getElementById('password');
     const emailInput = document.getElementById('email');
     const API_URL = 'http://localhost:3000/api';

     if (!form || !toggleBtn || !password || !message) {
          return;
     }

     toggleBtn.addEventListener('click', () => {
          const isHidden = password.type === 'password';
          password.type = isHidden ? 'text' : 'password';
          toggleBtn.textContent = isHidden ? 'Ẩn' : 'Hiện';
     });

     form.addEventListener('submit', async (event) => {
          event.preventDefault();

          if (!form.checkValidity()) {
               event.stopPropagation();
               form.classList.add('was-validated');
               return;
          }

          // Disable submit button to prevent multiple submissions
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;

          const email = emailInput.value.trim();
          const pwd = password.value;

          try {
               // Hiển thị trạng thái loading
               message.textContent = 'Đang xử lý...';
               message.classList.remove('d-none', 'alert-danger', 'alert-success');
               message.classList.add('alert-info');

               const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                         email: email,
                         password: pwd
                    })
               });

               const data = await response.json();

               if (response.ok && data.success) {
                    message.textContent = 'Đăng nhập thành công! Đang chuyển hướng...';
                    message.classList.remove('alert-danger', 'alert-info');
                    message.classList.add('alert-success');
                    
                    // Xóa dữ liệu cũ trước khi lưu
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    
                    // Lưu token và thông tin user
                    if (data.data && data.data.token && data.data.user) {
                         localStorage.setItem('token', data.data.token);
                         localStorage.setItem('user', JSON.stringify(data.data.user));
                         
                         // Dispatch event để cập nhật UI ở các tab khác
                         window.dispatchEvent(new Event('storage'));
                         
                         // Chuyển hướng sau 1.5 giây
                         setTimeout(() => {
                              window.location.href = '/pages/index.html';
                         }, 1500);
                    } else {
                         throw new Error('Dữ liệu không hợp lệ từ server');
                    }
               } else {
                    message.textContent = data.message || 'Đăng nhập thất bại!';
                    message.classList.remove('alert-info', 'alert-success');
                    message.classList.add('alert-danger');
                    
                    // Re-enable submit button on error
                    if (submitBtn) submitBtn.disabled = false;
               }
          } catch (error) {
               console.error('Login error:', error);
               message.textContent = 'Lỗi kết nối: ' + error.message;
               message.classList.remove('alert-info', 'alert-success');
               message.classList.add('alert-danger');
               
               // Re-enable submit button on error
               if (submitBtn) submitBtn.disabled = false;
          }
     });
})();
