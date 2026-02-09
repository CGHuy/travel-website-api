// Khởi tạo header
function initHeader() {
    updateAuthUI();
    setupLogout();
    setupAvatarDropdown();
}

// Auto init khi script load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
} else {
    // DOM đã sẵn sàng, chạy sau 1 tick để đảm bảo HTML đã render
    setTimeout(initHeader, 0);
}

// Đồng bộ đăng nhập / đăng xuất giữa nhiều tab
window.addEventListener('storage', () => {
    updateAuthUI();
    closeUserDropdown();
});

// ================== AUTH UI ==================
function updateAuthUI() {
     const token = localStorage.getItem('token');
     const user = localStorage.getItem('user');

     const loginBtn = document.getElementById('loginBtn');
     const registerBtn = document.getElementById('registerBtn');
     const userMenu = document.getElementById('userMenu');
     const userName = document.getElementById('userName');

     console.log('updateAuthUI - token:', token ? 'có' : 'không');
     console.log('updateAuthUI - elements:', { loginBtn, registerBtn, userMenu });

     if (token && user) {
          // Đã đăng nhập: Ẩn nút login/register, hiện userMenu
          if (loginBtn) loginBtn.classList.add('d-none');
          if (registerBtn) registerBtn.classList.add('d-none');
          if (userMenu) userMenu.classList.remove('d-none');
          if (userName) userName.classList.remove('d-none');

          try {
               const userData = JSON.parse(user);
               const avatarImg = document.getElementById('userAvatar');
               

               if (avatarImg) {
                    avatarImg.alt = userData.fullname;
               }

               if (userName) {
                    userName.textContent = `Hi! ${userData.fullname}`;
               }
          } catch (err) {
               console.error('Không đọc được dữ liệu user:', err);
          }
     } else {
          // Chưa đăng nhập: Hiện nút login/register, ẩn userMenu
          if (loginBtn) loginBtn.classList.remove('d-none');
          if (registerBtn) registerBtn.classList.remove('d-none');
          if (userMenu) userMenu.classList.add('d-none');

          closeUserDropdown();
     }
}

// ================== LOGOUT ==================
function setupLogout() {
     const logoutBtn = document.getElementById('logoutBtn');
     if (!logoutBtn) return;

     logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();

          if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) return;

          localStorage.removeItem('token');
          localStorage.removeItem('user');

          window.location.href = '/pages/index.html';
     });
}

// ================== AVATAR DROPDOWN ==================
function setupAvatarDropdown() {
     const avatarBtn = document.getElementById('avatarBtn');
     const userDropdown = document.getElementById('userDropdown');

     if (!avatarBtn || !userDropdown) return;

     avatarBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleUserDropdown();
     });

     document.addEventListener('click', (e) => {
          if (
               !avatarBtn.contains(e.target) &&
               !userDropdown.contains(e.target)
          ) {
               closeUserDropdown();
          }
     });
}

function toggleUserDropdown() {
     const dropdown = document.getElementById('userDropdown');
     if (!dropdown) return;

     dropdown.style.display =
          dropdown.style.display === 'block' ? 'none' : 'block';
}

function closeUserDropdown() {
     const dropdown = document.getElementById('userDropdown');
     if (dropdown) dropdown.style.display = 'none';
}
