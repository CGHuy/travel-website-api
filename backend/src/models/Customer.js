const db = require("../config/db");

class Customer {
    // 1. Tạo mới hành khách
    static async create(customerData) {
        try {
            const { booking_id, fullname, gender, dob, passenger_type } = customerData;
            const [result] = await db.query(
                `INSERT INTO passengers (booking_id, fullname, gender, dob, passenger_type, created_at) 
                 VALUES (?, ?, ?, ?, ?, NOW())`,
                [booking_id, fullname, gender, dob, passenger_type]
            );
            return result.insertId;
        } catch (error) {
            console.error("Error creating customer:", error);
            throw error;
        }
    }

    // 2. Lấy danh sách hành khách theo booking_id
    static async getByBookingId(bookingId) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM passengers WHERE booking_id = ? ORDER BY id ASC`,
                [bookingId]
            );
            return rows;
        } catch (error) {
            console.error("Error fetching passengers by booking_id:", error);
            throw error;
        }
    }

    // 3. Lấy thông tin chi tiết một hành khách
    static async getById(id) {
        try {
            const [rows] = await db.query(
                `SELECT * FROM passengers WHERE id = ?`,
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error("Error fetching customer by id:", error);
            throw error;
        }
    }

    
}

module.exports = Customer;
