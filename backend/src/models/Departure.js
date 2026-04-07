const db = require("../config/database");

class Departure {
    // Lấy tất cả departures
    static async getAll() {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_departures ORDER BY departure_date DESC`);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Tìm departure theo ID
    static async getById(id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_departures WHERE id = ?`, [id]);
            return rows[0];
        } catch (error) {
            throw error;
        }
    }

    // Tạo departure mới
    static async create(departureData) {
        try {
            const { tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total } = departureData;
            const seats_available = seats_total; // Ban đầu, số chỗ trống bằng tổng số chỗ
            const [result] = await db.query(
                `
                INSERT INTO tour_departures (tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `,
                [tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available],
            );
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật departure
    static async update(id, departureData) {
        try {
            const { tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available } = departureData;
            const [result] = await db.query(`UPDATE tour_departures SET tour_id = ?, departure_location = ?, departure_date = ?, price_moving = ?, price_moving_child = ?, seats_total = ?, seats_available = ?, updated_at = NOW() WHERE id = ?`, [tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available, id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Xóa departure
    static async delete(id) {
        try {
            const departure = await this.getById(id);
            if (!departure) {
                return false;
            }
            if (departure.status === 'open' || departure.status === 'full') {
                throw new Error('Không được phép xóa điểm khởi hành khi đang ở trạng thái Mở hoặc Đầy');
            }
            const [result] = await db.query(`DELETE FROM tour_departures WHERE id = ?`, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
    // Quản lý số chỗ ngồi
    static async updateAvailableSeats(id, seatsChange) {
        try {
            const [result] = await db.query(`UPDATE tour_departures SET seats_available = seats_available + ? WHERE id = ?`, [seatsChange, id]);
            return result.affectedRows > 0;
        } 
        catch (error) {
            throw error;
        }
    }
    // Quản lý giá vé
    static async updatePrice(id, price_moving, price_moving_child) {
        try {
            const [result] = await db.query(`UPDATE tour_departures SET price_moving = ?, price_moving_child = ? WHERE id = ?`, [price_moving, price_moving_child, id]);
            return result.affectedRows > 0;
        } 
        catch (error) {
            throw error;
        }
    }
    // Quản lý trạng thái điểm khởi hành
    static async updateStatus(id, status) {
        try {
            // Kiểm tra dữ liệu hợp lệ
            const validStatuses = ['open', 'closed', 'full'];
            if (!validStatuses.includes(status)) {
                throw new Error('Trạng thái không hợp lệ');
            }

            // Nếu chuyển sang 'open', kiểm tra có chỗ trống không
            if (status === 'open') {
                const departure = await this.getById(id);
                if (!departure) {
                    throw new Error('Không tìm thấy điểm khởi hành');
                }
                if (departure.seats_available <= 0) {
                    throw new Error('Không thể mở điểm khởi hành khi đã hết chỗ');
                }
            }

            const [result] = await db.query(`UPDATE tour_departures SET status = ?, updated_at = NOW() WHERE id = ?`, [status, id]);
            return result.affectedRows > 0;
        } 
        catch (error) {
            throw error;
        }
    }
    // Tìm kiếm departures theo nhiều tiêu chí
    static async searchDepartures(filters) {
        try {
            let query = `SELECT * FROM tour_departures WHERE 1=1`;
            const params = [];
            if (filters.id) {
                query += ` AND id = ?`;
                params.push(filters.id);
            }
            if (filters.tour_id) {
                query += ` AND tour_id = ?`;
                params.push(filters.tour_id);
            }
            if (filters.departure_location) {
                query += ` AND departure_location LIKE ?`;
                params.push(`%${filters.departure_location}%`);
            }
            if (filters.departure_date) {
                query += ` AND departure_date = ?`;
                params.push(filters.departure_date);
            }
            if (filters.status) {
                query += ` AND status = ?`;
                params.push(filters.status);
            }
            query += ` ORDER BY departure_date DESC`;
            const [results] = await db.query(query, params);
            return results;
        } catch (error) {
            throw error;
        }
    }

}

module.exports = Departure;





