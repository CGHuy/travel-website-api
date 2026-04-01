const db = require("../config/database");

class ListTourService {
    /**
     * Lấy danh sách tour dựa trên nhiều tiêu chí lọc
     * @param {Object} filters Gồm { search, max_price, region, duration_type, service_ids, sort }
     */
    static async getFilteredTours(filters) {
        // Query cơ bản lấy tours kèm ngày khởi hành sắp tới
        let baseSql = `
            SELECT 
                t.*,
                (
                    SELECT GROUP_CONCAT(DATE_FORMAT(departure_date, '%d/%m')) 
                    FROM tour_departures 
                    WHERE tour_id = t.id AND departure_date >= CURDATE()
                    ORDER BY departure_date ASC LIMIT 4
                ) as upcoming_dates
            FROM tours t
            WHERE 1=1
        `;
        
        // Mảng chứa các chuỗi điều kiện WHERE và Data (Values) mapping
        let whereClauses = [];
        let queryValues = [];

        const { search, max_price, region, duration_type, service_ids, sort } = filters;

        // 1. TÌM KIẾM (Search Name, Location, hoặc Mã Tour dạng TOUR001)
        if (search) {
            whereClauses.push(`(t.name LIKE ? OR t.location LIKE ? OR CONCAT('TOUR', LPAD(t.id, 3, '0')) LIKE ?)`);
            queryValues.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // 2. KHU VỰC (Vùng miền)
        if (region) {
            whereClauses.push(`t.region = ?`);
            queryValues.push(region);
        }

        // 3. KHOẢNG GIÁ
        if (max_price) {
            whereClauses.push(`t.price_default <= ?`);
            queryValues.push(Number(max_price));
        }

        // 4. THỜI LƯỢNG ("short" cho 1-3 ngày, "long" cho 4+ ngày)
        // Vì CSDL là VARCHAR (VD: 4N3Đ) nên map điều kiện LIKE tạm thời. 
        if (duration_type) {
            if (duration_type === 'dur_short') {
                whereClauses.push(`(t.duration LIKE '%1N%' OR t.duration LIKE '%2N%' OR t.duration LIKE '%3N%')`);
            } else if (duration_type === 'dur_long') {
                whereClauses.push(`(t.duration NOT LIKE '%1N%' AND t.duration NOT LIKE '%2N%' AND t.duration NOT LIKE '%3N%')`);
            }
        }

        // 5. DỊCH VỤ ĐẶC BIỆT (Multi Select - Check Many-To-Many Table)
        if (service_ids && service_ids.length > 0) {
            const placeholders = service_ids.map(() => '?').join(',');
            whereClauses.push(`
                t.id IN (
                    SELECT tour_id FROM tour_services 
                    WHERE service_id IN (${placeholders})
                    GROUP BY tour_id
                )
            `);
            queryValues.push(...service_ids);
        }

        // Nối mảng Query lại bằng AND
        if (whereClauses.length > 0) {
            baseSql += ` AND ` + whereClauses.join(' AND ');
        }

        // 6. SẮP XẾP (Giá vs Timestamp)
        if (sort === 'price_asc') {
            baseSql += ` ORDER BY t.price_default ASC`;
        } else if (sort === 'price_desc') {
            baseSql += ` ORDER BY t.price_default DESC`;
        } else {
            baseSql += ` ORDER BY t.created_at DESC`; // Mặc định hiển thị Mới hơn trước tiên
        }

        try {
            // Đưa vào thư viện MySQL Query
            const [rows] = await db.query(baseSql, queryValues);
            return rows;
        } catch (error) {
            throw new Error(`Tour Service Filter Error: ${error.message}`);
        }
    }
    /**
     * Lấy danh sách tất cả các dịch vụ đang hoạt động
     */
    static async getAllServices() {
        try {
            const [rows] = await db.query(`SELECT id, name FROM services WHERE status = 1 ORDER BY name ASC`);
            return rows;
        } catch (error) {
            throw new Error(`Tour Service GetServices Error: ${error.message}`);
        }
    }
}

module.exports = ListTourService;
