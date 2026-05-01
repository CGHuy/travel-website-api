const db = require("../config/database");
const servicesModel = require("../models/Service");
const tourModel = require("../models/Tour");
const tourServiceModel = require("../models/TourService");
const tourImageModel = require("../models/TourImage");
const tourItineraryModel = require("../models/TourItinerary");
const review = require("../models/Review");
const departureModel = require("../models/Departure");

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
                t.id,
                t.name,
                t.location,
                t.price_default,
                t.duration,
                t.region,
                t.cover_image,
                (
                    SELECT GROUP_CONCAT(DATE_FORMAT(departure_date, '%d/%m')) 
                    FROM tour_departures 
                    WHERE tour_id = t.id AND departure_date >= CURDATE()
                    ORDER BY departure_date ASC LIMIT 4
                ) as upcoming_dates,
                (
                    SELECT GROUP_CONCAT(loc.departure_location SEPARATOR '||')
                    FROM (
                        SELECT td.departure_location, MIN(td.departure_date) AS nearest_departure
                        FROM tour_departures td
                        WHERE td.tour_id = t.id AND td.departure_date >= CURDATE()
                        GROUP BY td.departure_location
                        ORDER BY nearest_departure ASC
                        LIMIT 3
                    ) loc
                ) as departure_locations
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
            const normalizedRows = rows.map((tour) => ({
                ...tour,
                departure_locations: tour.departure_locations
                    ? tour.departure_locations.split('||')
                    : [],
            }));

            // Lấy tổng số bản ghi khớp điều kiện (không tính LIMIT)
            const [[{ total }]] = await db.query('SELECT FOUND_ROWS() as total');

            return {
                tours: normalizedRows,
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
            const services = await tourServiceModel.getServicesByTourIdForListTour(id);

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

    //Hàm lấy thông tin để hiển thị lên giao diện đặt tour
    static async getTourAndDepartures(tourId) {
        try {
            // Lấy thông tin tour
            const tour = await tourModel.getTourInfoForBookingById(tourId);
            if (!tour) {
                throw new Error("Tour không tồn tại");
            }
            // Lấy danh sách các ngày khởi hành của tour
            const departures = await departureModel.getByTourIdAndAvailable(tourId);
            return { tour, departures };
        } catch (error) {
            console.error("Lỗi tại getTourAndDepartures:", error);
            throw new Error(`Lấy thông tin tour và ngày khởi hành thất bại: ${error.message}`);
        }
    }

    /**
     * Lấy danh sách tour cho AI: Tìm kiếm sâu (deep search) vào cả lịch trình và dịch vụ
     * Trả về chi tiết tour bao gồm cả lịch trình để AI đọc hiểu dễ hơn
     */
    static async getToursForAI(filters) {
        const page = parseInt(filters.page) || 1;
        const limit = parseInt(filters.limit) || 5;
        const offset = (page - 1) * limit;

        let baseSql = `
            SELECT SQL_CALC_FOUND_ROWS
                t.id, t.name, t.location, t.price_default, t.duration, t.region, t.cover_image,
                (
                    SELECT GROUP_CONCAT(DATE_FORMAT(departure_date, '%d/%m')) 
                    FROM tour_departures 
                    WHERE tour_id = t.id AND departure_date >= CURDATE()
                    ORDER BY departure_date ASC LIMIT 4
                ) as upcoming_dates,
                (
                    SELECT GROUP_CONCAT(loc.departure_location SEPARATOR '||')
                    FROM (
                        SELECT td.departure_location, MIN(td.departure_date) AS nearest_departure
                        FROM tour_departures td
                        WHERE td.tour_id = t.id AND td.departure_date >= CURDATE()
                        GROUP BY td.departure_location
                        ORDER BY nearest_departure ASC
                        LIMIT 3
                    ) loc
                ) as departure_locations
            FROM tours t
            WHERE 1=1
        `;

        let whereClauses = [];
        let queryValues = [];

        const { search, max_price, region, duration_type, service_ids, sort } = filters;

        // 1. TÌM KIẾM SÂU (Deep Search vào Tên, Địa điểm, Lịch trình, Dịch vụ)
        if (search) {
            whereClauses.push(`(
                t.name LIKE ? 
                OR t.location LIKE ? 
                OR t.id IN (SELECT tour_id FROM tour_itineraries WHERE description LIKE ? OR day_number LIKE ?)
                OR t.id IN (SELECT ts.tour_id FROM tour_services ts JOIN services s ON ts.service_id = s.id WHERE s.name LIKE ?)
            )`);
            const searchTerm = `%${search}%`;
            queryValues.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
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
            const daysSql = `CAST(t.duration AS UNSIGNED)`;
            if (duration_type === 'dur_short') {
                whereClauses.push(`${daysSql} BETWEEN 1 AND 3`);
            } else if (duration_type === 'dur_long') {
                whereClauses.push(`${daysSql} >= 4`);
            }
        }

        // 5. DỊCH VỤ ĐẶC BIỆT
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

        if (sort === 'price_asc') {
            baseSql += ` ORDER BY t.price_default ASC`;
        } else if (sort === 'price_desc') {
            baseSql += ` ORDER BY t.price_default DESC`;
        } else {
            baseSql += ` ORDER BY t.created_at DESC`;
        }

        baseSql += ` LIMIT ? OFFSET ?`;
        queryValues.push(limit, offset);

        try {
            const [rows] = await db.query(baseSql, queryValues);
            const [[{ total }]] = await db.query('SELECT FOUND_ROWS() as total');

            // Lấy thêm chi tiết Lịch trình & Dịch vụ cho từng tour để AI đọc
            const detailedTours = await Promise.all(rows.map(async (tour) => {
                const itineraries = await tourItineraryModel.getByTourId(tour.id);
                const services = await tourServiceModel.getServicesByTourIdForListTour(tour.id);
                return {
                    ...tour,
                    departure_locations: tour.departure_locations ? tour.departure_locations.split('||') : [],
                    itineraries,
                    services
                };
            }));

            return {
                tours: detailedTours,
                totalCount: total,
                currentPage: page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new Error(`Tour Service Deep Filter Error: ${error.message}`);
        }
    }

    static async getTourSuggestions(userMessage) {
        try {
            // Bước 1: Yêu cầu Ollama trích xuất thông tin thành JSON
            const extractPrompt = `
Bạn là một hệ thống AI trích xuất dữ liệu. 
Từ câu nói của khách hàng, hãy trích xuất các thông tin sau và trả về DUY NHẤT một đối tượng JSON hợp lệ (không kèm theo bất kỳ văn bản nào khác, không dùng markdown block \`\`\`json):
- "search": (string) Tên địa điểm, tỉnh thành hoặc quốc gia khách muốn đến. Nếu không rõ, để "".
- "max_price": (number) Mức giá tối đa khách có thể trả. Ví dụ: "dưới 5 triệu" -> 5000000. Nếu không rõ, để null.
- "region": (string) Vùng miền ("Trong Nước" hoặc "Quốc Tế"). Nếu không rõ, để "".
- "duration_type": (string) Loại thời gian ("dur_short" nếu <= 3 ngày, "dur_long" nếu >= 4 ngày). Nếu không rõ, để "".

Câu nói của khách: "${userMessage}"
`;

            const extractResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen2:1.5b',
                    prompt: extractPrompt,
                    stream: false,
                    format: 'json'
                })
            });

            const extractData = await extractResponse.json();
            let filters = {};
            try {
                filters = JSON.parse(extractData.response);
            } catch (e) {
                console.error("Ollama không trả về JSON hợp lệ, dùng filter mặc định.");
            }

            // Chuẩn bị params gọi DB
            const tourFilters = {
                search: filters.search || '',
                max_price: filters.max_price || null,
                region: filters.region || '',
                duration_type: filters.duration_type || '',
                page: 1,
                limit: 5
            };

            // Bước 2: Gọi DB để lấy tours (dùng hàm getToursForAI mới tạo)
            const searchResult = await this.getToursForAI(tourFilters);
            const foundTours = searchResult.tours;

            if (foundTours.length === 0) {
                return {
                    reply: "Rất tiếc, tôi không tìm thấy tour nào phù hợp với yêu cầu của bạn lúc này. Bạn có thể thay đổi yêu cầu (ví dụ: tăng mức giá hoặc chọn địa điểm khác) được không?",
                    tours: [],
                    totalCount: 0,
                    currentPage: 1,
                    totalPages: 0
                };
            }

            // Bước 3: Đưa dữ liệu thô cho Ollama để tạo câu trả lời
            const toursContext = foundTours.map(t => {
                let ctx = `• ${t.name} — ${Number(t.price_default).toLocaleString('vi-VN')} VND — ${t.duration}`;
                if (t.services && t.services.length > 0) {
                    ctx += ` (Dịch vụ: ${t.services.map(s => s.name).join(', ')})`;
                }
                return ctx;
            }).join('\n');

            const generatePrompt = `Bạn là tư vấn viên du lịch. Khách hỏi: "${userMessage}"
Danh sách tour phù hợp:
${toursContext}

Yêu cầu: Trả lời NGẮN GỌN trong 2-4 câu bằng tiếng Việt. Chỉ giới thiệu tên tour, giá, và 1 điểm nổi bật. KHÔNG liệt kê chi tiết lịch trình.`;


            const finalResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'qwen2:1.5b',
                    prompt: generatePrompt,
                    stream: false
                })
            });

            const finalData = await finalResponse.json();
            
            // Loại bỏ các trường dài dòng (itineraries, services) để Frontend nhận data giống hệt getFilteredTours
            const uiTours = searchResult.tours.map(t => {
                const { itineraries, services, ...cleanTour } = t;
                return cleanTour;
            });

            return {
                reply: finalData.response,
                tours: uiTours,
                totalCount: searchResult.totalCount,
                currentPage: searchResult.currentPage,
                totalPages: searchResult.totalPages
            };

        } catch (error) {
            console.error("Lỗi tại getTourSuggestions:", error);
            throw new Error(`Lấy gợi ý AI thất bại: ${error.message}`);
        }
    }
}

module.exports = ListTourService;
