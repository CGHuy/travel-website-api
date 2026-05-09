const db = require("../config/database");

class Departure {
    // Đồng bộ trạng thái theo ngày khởi hành và số chỗ còn trống
    static async syncStatus(id) {
        await db.query(
            `
                UPDATE tour_departures
                SET status = CASE
                    WHEN departure_date < CURDATE() THEN 'closed'
                    WHEN status = 'closed' THEN 'closed'
                    WHEN seats_available <= 0 THEN 'full'
                    ELSE 'open'
                END,
                updated_at = NOW()
                WHERE id = ?
            `,
            [id],
        );
    }

    // Lấy tất cả departures
    static async getAll() {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_departures ORDER BY departure_date DESC`);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    //Lấy departures theo tour_id
    static async getByTourId(tour_id) {
        try {
            const [rows] = await db.query(`SELECT * FROM tour_departures WHERE tour_id = ? ORDER BY departure_date DESC`, [tour_id]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    //Lấy departures theo tour_id sao cho ngày khởi hành lớn hơn ngày hiện tại và còn trống chỗ
    static async getByTourIdAndAvailable(tour_id) {
        try {
            const [rows] = await db.query(`
                SELECT * FROM tour_departures 
                WHERE tour_id = ? AND departure_date >= CURDATE() AND seats_available > 0
                ORDER BY departure_date DESC
            `, [tour_id]);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // Lấy departure theo ID
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
            const tourId = Number(departureData.tour_id);
            const departureLocation = departureData.departure_location;
            const departureDate = departureData.departure_date;
            const priceMoving = Number(departureData.price_moving);
            const priceMovingChild = Number(departureData.price_moving_child);
            const seatsTotal = Number(departureData.seats_total);
            const seatsAvailable = seatsTotal;

            const [result] = await db.query(
                `
                INSERT INTO tour_departures (tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `,
                [tourId, departureLocation, departureDate, priceMoving, priceMovingChild, seatsTotal, seatsAvailable],
            );
            await this.syncStatus(result.insertId);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Cập nhật departure
    static async update(id, departureData) {
        try {
            if (!departureData || typeof departureData !== 'object') {
                throw new Error('Dữ liệu cập nhật không hợp lệ');
            }

            const departure = await this.getById(id);
            if (!departure) {
                return false;
            }

            const fields = [];
            const params = [];

            if (departureData.tour_id !== undefined) {
                fields.push('tour_id = ?');
                params.push(Number(departureData.tour_id));
            }
            if (departureData.departure_location !== undefined) {
                fields.push('departure_location = ?');
                params.push(departureData.departure_location);
            }
            if (departureData.departure_date !== undefined) {
                fields.push('departure_date = ?');
                params.push(departureData.departure_date);
            }
            if (departureData.price_moving !== undefined) {
                fields.push('price_moving = ?');
                params.push(Number(departureData.price_moving));
            }
            if (departureData.price_moving_child !== undefined) {
                fields.push('price_moving_child = ?');
                params.push(Number(departureData.price_moving_child));
            }
            if (departureData.seats_total !== undefined) {
                const seatsTotal = Number(departureData.seats_total);
                fields.push('seats_total = ?');
                params.push(seatsTotal);

                if (departureData.seats_available === undefined && Number(departure.seats_available) > seatsTotal) {
                    departureData.seats_available = seatsTotal;
                }
            }
            if (departureData.seats_available !== undefined) {
                fields.push('seats_available = ?');
                params.push(Number(departureData.seats_available));
            }

            if (fields.length === 0) {
                throw new Error('Không có trường nào để cập nhật');
            }

            const query = `UPDATE tour_departures SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
            params.push(id);

            const [result] = await db.query(query, params);
            if (result.affectedRows > 0) {
                await this.syncStatus(id);
            }
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

            const depDate = new Date(departure.departure_date);
            const today = new Date();
            depDate.setHours(0,0,0,0);
            today.setHours(0,0,0,0);
            
            const actualStatus = (depDate < today) ? 'closed' : departure.status;

            // 1. Kiểm tra trạng thái
            if (actualStatus === 'open' || actualStatus === 'full') {
                throw new Error('Không được phép xóa điểm khởi hành khi đang ở trạng thái Mở hoặc Đầy. Vui lòng chuyển sang Đóng trước khi xóa.');
            }

            // 2. Kiểm tra xem đã có booking nào chưa
            const [bookings] = await db.query(`SELECT id FROM bookings WHERE departure_id = ? LIMIT 1`, [id]);
            if (bookings.length > 0) {
                throw new Error('Không thể xóa điểm khởi hành này vì đã có đơn đặt chỗ (Booking) liên quan. Bạn chỉ có thể ẩn hoặc đóng điểm khởi hành này.');
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
            const [result] = await db.query(
                `UPDATE tour_departures SET seats_available = GREATEST(0, LEAST(seats_total, seats_available + ?)) WHERE id = ?`,
                [seatsChange, id],
            );
            if (result.affectedRows > 0) {
                await this.syncStatus(id);
            }
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

            const departure = await this.getById(id);
            if (!departure) {
                throw new Error('Không tìm thấy điểm khởi hành');
            }

            const depDate = new Date(departure.departure_date);
            const today = new Date();
            depDate.setHours(0,0,0,0);
            today.setHours(0,0,0,0);

            if (depDate < today && status !== 'closed') {
                throw new Error('Chuyến đi đã qua ngày khởi hành, bắt buộc phải ở trạng thái Đóng');
            }

            // Nếu chuyển sang 'open', kiểm tra có chỗ trống không
            if (status === 'open') {
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
            const statusCase = `CASE
                    WHEN departure_date < CURDATE() OR status = 'closed' THEN 'closed'
                    WHEN seats_available <= 0 THEN 'full'
                    ELSE 'open'
                END`;

            let query = `SELECT id, tour_id, departure_location, departure_date, price_moving, price_moving_child, seats_total, seats_available, created_at, updated_at, ${statusCase} AS status FROM tour_departures WHERE 1=1`;
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
                query += ` AND (${statusCase}) = ?`;
                params.push(filters.status);
            }
            query += ` ORDER BY departure_date DESC`;
            const [results] = await db.query(query, params);
            return results;
        } catch (error) {
            throw error;
        }
    }

    // == Thống kê ==
    static async countOpenDepartures() {
        try {
            const [rows] = await db.query(`SELECT COUNT(*) AS count FROM tour_departures 
			WHERE status = 'open' AND departure_date >= CURDATE()`);
            return rows[0].count;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Departure;





