document.addEventListener('DOMContentLoaded', function () {
     initHeader();
});

// KHỞI TẠO HEADER
function initHeader() {
     updateAuthUI();
     setupLogout();
}

// ĐỒNG BỘ GIỮA NHIỀU TAB
window.addEventListener('storage', function () {
     updateAuthUI();
});

function updateAuthUI() {
     const token = localStorage.getItem('token');
     const user = localStorage.getItem('user');

     const loginBtn = document.getElementById('loginBtn');
     const registerBtn = document.getElementById('registerBtn');
     const userMenu = document.getElementById('userMenu');

     // Nếu đã đăng nhập
     if (token && user) {
          if (loginBtn) loginBtn.classList.add('d-none');
          if (registerBtn) registerBtn.classList.add('d-none');
          if (userMenu) userMenu.classList.remove('d-none');

          // Cập nhật tên người dùng (nếu có)
          try {
               const userData = JSON.parse(user);
               const avatarImg = document.getElementById('userAvatar');

               if (avatarImg && userData.fullname) {
                    avatarImg.alt = userData.fullname;
                    avatarImg.title = userData.fullname;
               }
          } catch (error) {
               console.error('Không đọc được dữ liệu user');
          }
     }
     // Nếu CHƯA đăng nhập
     else {
          if (loginBtn) loginBtn.classList.remove('d-none');
          if (registerBtn) registerBtn.classList.remove('d-none');
          if (userMenu) userMenu.classList.add('d-none');
     }
}

function setupLogout() {
     const logoutBtn = document.getElementById('logoutBtn');

     if (!logoutBtn) return;

     logoutBtn.addEventListener('click', function (e) {
          e.preventDefault();

          const isConfirm = confirm('Bạn có chắc chắn muốn đăng xuất?');
          if (!isConfirm) return;

          localStorage.removeItem('token');
          localStorage.removeItem('user');

          window.location.href = '/pages/index.html';
     });
}


