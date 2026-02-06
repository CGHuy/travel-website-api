(() => {
     const form = document.getElementById('loginForm');
     const message = document.getElementById('loginMessage');
     const toggleBtn = document.getElementById('togglePwd');
     const password = document.getElementById('password');

     if (!form || !toggleBtn || !password || !message) {
          return;
     }

     toggleBtn.addEventListener('click', () => {
          const isHidden = password.type === 'password';
          password.type = isHidden ? 'text' : 'password';
          toggleBtn.textContent = isHidden ? 'Ẩn' : 'Hiện';
     });

     form.addEventListener('submit', (event) => {
          if (!form.checkValidity()) {
               event.preventDefault();
               event.stopPropagation();
               form.classList.add('was-validated');
               return;
          }

          event.preventDefault();
          message.textContent = 'Demo: Dang nhap thanh cong (front-end).';
          message.classList.remove('d-none');
          message.classList.remove('alert-danger');
          message.classList.add('alert-success');
     });
})();
