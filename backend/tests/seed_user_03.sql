-- Đảm bảo user ID=35 tồn tại và reset về trạng thái ban đầu
INSERT IGNORE INTO users (id, fullname, email, phone, password, role, status) VALUES (35, 'Nguyễn Văn A', 'nhanvientc01@viettravel.com', '0988777666', '$2b$10$qHUobJjg77G/ZbVUGrcZteSABtBXiNPiIvaoU1BIh5o3jhv7wQyom', 'tour-staff', 1);
UPDATE users SET fullname = 'Nguyễn Văn A', phone = '0988777666', status = 1 WHERE id = 35;
