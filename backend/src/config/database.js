const mysql = require('mysql2');
require('dotenv').config();

// Tạo connection pool (hiệu quả hơn single connection)
const pool = mysql.createPool({
     host: process.env.DB_HOST,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD,
     database: process.env.DB_NAME,
     waitForConnections: true, // Chờ khi không có kết nối sẵn có
     connectionLimit: 10,
     queueLimit: 0
});

// Sử dụng promise để dễ làm việc với async/await
const promisePool = pool.promise();

// Test kết nối
pool.getConnection((err, connection) => {
     if (err) {
          console.error('❌ Lỗi kết nối database:', err.message);
          return;
     }
     console.log('✅ Kết nối database thành công!');
     connection.release();
});

module.exports = promisePool;