const db = require("../config/database");
const servicesModel = require("../models/Service");
const tourModel = require("../models/Tour");
const tourServiceModel = require("../models/TourService");
const  tourImageModel = require("../models/TourImage");
const tourItineraryModel = require("../models/TourItinerary");
const review = require("../models/Review");

class ListTourService {
    /**
     * Lấy danh sách tour dựa trên nhiều tiêu chí lọc và phân trang
     * @param {Object} filters Gồm { search, max_price, region, duration_type, service_ids, sort, page, limit }
     */
    static async getFilteredTours(filters) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 6;
        const offset = (page - 1) * limit;

        // Query cơ bản lấy tours kèm ngày khởi hành sắp tới
        // Thêm SQL_CALC_FOUND_ROWS để lấy tổng số hàng khớp bộ lọc mà không cần query lại lần 2 (tối ưu performance)
        let baseSql = `
            SELECT SQL_CALC_FOUND_ROWS
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
        
        let whereClauses = [];
        let queryValues = [];

        const { search, max_price, region, duration_type, service_ids, sort } = filters;

        // 1. TÌM KIẾM
        if (search) {
            whereClauses.push(`(t.name LIKE ? OR t.location LIKE ? OR CONCAT('TOUR', LPAD(t.id, 3, '0')) LIKE ?)`);
            queryValues.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // 2. KHU VỰC
        if (region) {
            whereClauses.push(`t.region = ?`);
            queryValues.push(region);
        }

        // 3. KHOẢNG GIÁ
        if (max_price) {
            whereClauses.push(`t.price_default <= ?`);
            queryValues.push(Number(max_price));
        }

        // 4. THỜI LƯỢNG
        if (duration_type) {
            // Trích xuất số ngày từ đầu chuỗi duration (ví dụ: "3 ngày 2 đêm" -> 3)
            const daysSql = `CAST(t.duration AS UNSIGNED)`; 
            if (duration_type === 'dur_short') {
                whereClauses.push(`${daysSql} BETWEEN 1 AND 3`);
            } else if (duration_type === 'dur_long') {
                whereClauses.push(`${daysSql} >= 4`);
            }
        }

        // 5. DỊCH VỤ ĐẶC BIỆT (Logic AND: Tour phải có đủ tất cả dịch vụ đã chọn)
        if (service_ids && service_ids.length > 0) {
            const placeholders = service_ids.map(() => '?').join(',');
            whereClauses.push(`
                t.id IN (
                    SELECT tour_id FROM tour_services 
                    WHERE service_id IN (${placeholders})
                    GROUP BY tour_id
                    HAVING COUNT(DISTINCT service_id) = ${service_ids.length}
                )
            `);
            queryValues.push(...service_ids);
        }

        if (whereClauses.length > 0) {
            baseSql += ` AND ` + whereClauses.join(' AND ');
        }

        // 6. SẮP XẾP
        if (sort === 'price_asc') {
            baseSql += ` ORDER BY t.price_default ASC`;
        } else if (sort === 'price_desc') {
            baseSql += ` ORDER BY t.price_default DESC`;
        } else {
            baseSql += ` ORDER BY t.created_at DESC`;
        }

        // 7. PHÂN TRANG
        baseSql += ` LIMIT ? OFFSET ?`;
        queryValues.push(limit, offset);

        try {
            const [rows] = await db.query(baseSql, queryValues);
            // Lấy tổng số bản ghi khớp điều kiện (không tính LIMIT)
            const [[{ total }]] = await db.query('SELECT FOUND_ROWS() as total');
            
            return {
                tours: rows,
                totalCount: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new Error(`Tour Service Filter Error: ${error.message}`);
        }
    }
    /**
     * Lấy danh sách tất cả các dịch vụ (Sử dụng Model thay vì viết query thuần)
     */
    static async getAllServices() {
        try {
            // Thay thế query SQL thô bằng việc gọi hàm từ servicesModel đã import
            return await servicesModel.getAll();
        } catch (error) {
            console.error("Lỗi tại getAllServices:", error);
            throw new Error(`Tour Service GetServices Error: ${error.message}`);
        }
    }

    static async getDetailTour(id) {
        try {
            // 1. Lấy thông tin cơ bản của Tour từ bảng tours
            const tour = await tourModel.getById(id);
            
            // Nếu không tìm thấy tour, trả về null ngay
            if (!tour) return null;

            // 2. Lấy danh sách tất cả hình ảnh của tour này từ bảng tour_images
            const images = await tourImageModel.getByTourId(id);

            // 3. Lấy danh sách các dịch vụ đi kèm của tour từ bảng tour_services (kèm join với bảng services)
            const services = await tourServiceModel.getServicesByTourId(id);

            // 4. Lấy danh sách lịch trình của tour
            const itineraries = await tourItineraryModel.getByTourId(id);
            
            // 5. Lấy đánh giá của tour
            const reviews = await review.getByTourId(id);

            // Tự động tính toán tổng số đánh giá và điểm trung bình
            const total_reviews = reviews.length;
            const avg_rating = total_reviews > 0 
                ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / total_reviews).toFixed(1) 
                : 0;
 
            // 6. Trả về đối tượng tour đã được gộp đầy đủ thông tin
            return {
                ...tour,
                images: images,
                services: services,
                itineraries: itineraries,
                reviews: reviews,
                total_reviews: total_reviews,
                avg_rating: avg_rating
            };
        } catch (error) {
            console.error("Lỗi tại getDetailTour:", error);
            throw new Error(`Lấy chi tiết tour thất bại: ${error.message}`);
        }
    }

}

module.exports = ListTourService;
