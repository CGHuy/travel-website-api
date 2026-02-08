(() => {
     const registerForm = document.getElementById('registerForm');
     const messageAlert = document.getElementById('messageAlert');
     const messageText = document.getElementById('messageText');
     const toggleBtn = document.getElementById('togglePwd');
     const password = document.getElementById('passwordInput');

     // Nếu thiếu element quan trọng → thoát
     if (!registerForm || !messageAlert || !messageText || !toggleBtn || !password) {
          return;
     }

     // Toggle password visibility
     toggleBtn.addEventListener('click', () => {
          const isHidden = password.type === 'password';
          password.type = isHidden ? 'text' : 'password';
          toggleBtn.textContent = isHidden ? 'Ẩn' : 'Hiện';
     });

     // Handle form submission
     registerForm.addEventListener('submit', async (e) => {
          e.preventDefault();

          // Validate form (HTML5 + Bootstrap)
          if (!registerForm.checkValidity()) {
               e.stopPropagation();
               registerForm.classList.add('was-validated');
               return;
          }

          // Disable submit button to prevent multiple submissions
          const submitBtn = registerForm.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;

          const formData = new FormData(registerForm);
          const data = {
               fullname: formData.get('fullname'),
               phone: formData.get('phone'),
               email: formData.get('email'),
               password: formData.get('password')
          };

          try {
               const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
               });

               const result = await response.json();

               if (response.ok && result.success) {
                    showMessage(result.message || 'Đăng ký thành công! Chuyển hướng đến đăng nhập...', 'success');

                    registerForm.reset();
                    registerForm.classList.remove('was-validated');

                    setTimeout(() => {
                         window.location.href = 'login.html';
                    }, 2000);
               } else {
                    showMessage(
                         result.message || 'Đăng ký thất bại. Vui lòng thử lại.',
                         'danger'
                    );
                    // Re-enable submit button on error
                    if (submitBtn) submitBtn.disabled = false;
               }
          } catch (error) {
               console.error('Registration error:', error);
               showMessage('Có lỗi xảy ra: ' + error.message, 'danger');
               // Re-enable submit button on error
               if (submitBtn) submitBtn.disabled = false;
          }
     });

     // Show message helper
     function showMessage(message, type) {
          messageText.textContent = message;
          messageAlert.className = `alert alert-${type} alert-dismissible fade show`;
          messageAlert.style.display = 'block';

          setTimeout(() => {
               messageAlert.classList.remove('show');
               setTimeout(() => {
                    messageAlert.style.display = 'none';
               }, 150);
          }, 5000);
     }
})();
