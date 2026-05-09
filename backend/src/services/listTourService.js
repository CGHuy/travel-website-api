const db = require("../config/database");
const servicesModel = require("../models/Service");
const tourModel = require("../models/Tour");
const tourServiceModel = require("../models/TourService");
const tourImageModel = require("../models/TourImage");
const tourItineraryModel = require("../models/TourItinerary");
const review = require("../models/Review");
const departureModel = require("../models/Departure");

// Config
const MAX_QUERY_LIMIT = 1000;
const AI_MODEL = process.env.AI_MODEL || "qwen2:7b";
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434/api/generate";

// Regex patterns cho extraction
const PATTERNS = {
    price: /(?:dưới|tối đa|khoảng|chỉ)?\s*(\d+)\s*(?:triệu|tr|trieu)/i,
    short_duration: /\b([1-3])\s*(?:ngày|n)\b|\b3n2d\b|ngắn|short/i,
    long_duration: /\b([4-9]|1[0-9]|2[0-9])\s*(?:ngày|n)\b|\b4\+\b|dài|long|tuần|week/i,
    north: /mien bac|bac ky|north/i,
    central: /mien trung|trung ky|central/i,
    south: /mien nam|nam ky|south/i,
    departure: /(?:khởi hành từ|xuất phát từ|đón tại|đi từ|departure from)\s+([^,.]+?)(?=\s+(?:và|hoặc|,|\.|$)|,|\.|$)/i,
};

// Score weights
const SCORE_WEIGHTS = {
    price: 2,
    duration: 2,
    region: 3,
    tour_name: 5,
    tour_location: 5,
    departure_location: 4,
    departure_bonus: 3,
    price_ratio: 2,
};

class ListTourService {
    /**
     * Lấy danh sách tour dựa trên nhiều tiêu chí lọc và phân trang
     * @param {Object} filters Gồm { search, max_price, region, duration_type, service_ids, sort, page, limit }
     * @param {number} filters.limit Số tour trên một trang (nếu null/undefined = lấy tất cả không phân trang)
     */
    static async getFilteredTours(filters) {
        const page = parseInt(filters.page) || 1;
        const limit = filters.limit === null || filters.limit === undefined ? null : Math.min(parseInt(filters.limit), MAX_QUERY_LIMIT);
        const offset = limit ? (page - 1) * limit : 0;

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
            if (duration_type === "dur_short") {
                whereClauses.push(`${daysSql} BETWEEN 1 AND 3`);
            } else if (duration_type === "dur_long") {
                whereClauses.push(`${daysSql} >= 4`);
            }
        }

        // 5. DỊCH VỤ ĐẶC BIỆT (Logic AND: Tour phải có đủ tất cả dịch vụ đã chọn)
        if (service_ids && service_ids.length > 0) {
            const placeholders = service_ids.map(() => "?").join(",");
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
            baseSql += ` AND ` + whereClauses.join(" AND ");
        }

        // 6. SẮP XẾP
        if (sort === "price_asc") {
            baseSql += ` ORDER BY t.price_default ASC`;
        } else if (sort === "price_desc") {
            baseSql += ` ORDER BY t.price_default DESC`;
        } else {
            baseSql += ` ORDER BY t.created_at DESC`;
        }

        // 7. PHÂN TRANG (chỉ append LIMIT nếu có limit)
        if (limit) {
            baseSql += ` LIMIT ? OFFSET ?`;
            queryValues.push(limit, offset);
        }

        try {
            const [rows] = await db.query(baseSql, queryValues);
            const normalizedRows = rows.map((tour) => ({
                ...tour,
                departure_locations: tour.departure_locations ? tour.departure_locations.split("||") : [],
            }));

            // Lấy tổng số bản ghi khớp điều kiện (không tính LIMIT)
            const [[{ total }]] = await db.query("SELECT FOUND_ROWS() as total");

            return {
                tours: normalizedRows,
                totalCount: total,
                currentPage: page,
                totalPages: limit ? Math.ceil(total / limit) : 1,
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
            const avg_rating = total_reviews > 0 ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / total_reviews).toFixed(1) : 0;

            // 6. Trả về đối tượng tour đã được gộp đầy đủ thông tin
            return {
                ...tour,
                images: images,
                services: services,
                itineraries: itineraries,
                reviews: reviews,
                total_reviews: total_reviews,
                avg_rating: avg_rating,
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

    static normalizeText(value) {
        return String(value || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    static parseDurationDays(durationText) {
        const match = String(durationText || "").match(/(\d+)/);
        return match ? parseInt(match[1], 10) : null;
    }

    static parseHybridConstraints(userMessage) {
        const normalizedMessage = this.normalizeText(userMessage);
        
        return {
            normalizedMessage,
            max_price: (userMessage.match(PATTERNS.price)?.[1] ? parseInt(userMessage.match(PATTERNS.price)[1], 10) * 1000000 : null),
            duration_type: PATTERNS.short_duration.test(userMessage) ? "dur_short" : PATTERNS.long_duration.test(userMessage) ? "dur_long" : "",
            region: PATTERNS.north.test(userMessage) ? "Miền Bắc" : PATTERNS.central.test(userMessage) ? "Miền Trung" : PATTERNS.south.test(userMessage) ? "Miền Nam" : "",
            departure_location: (userMessage.match(PATTERNS.departure)?.[1] || "").trim(),
        };
    }

    static scoreTourForSuggestion(tour, constraints) {
        const {normalizedMessage} = constraints;
        const normalized = {
            name: this.normalizeText(tour.name),
            location: this.normalizeText(tour.location),
            region: this.normalizeText(tour.region),
            departures: String(tour.departure_locations || "").split("||").map(l => this.normalizeText(l)).filter(Boolean),
        };
        const price = Number(tour.price_default) || 0;
        const duration = this.parseDurationDays(tour.duration);

        // Hard filters (knockout conditions)
        if (constraints.max_price && price > constraints.max_price) return -Infinity;
        if (constraints.duration_type === "dur_short" && duration && duration > 3) return -Infinity;
        if (constraints.duration_type === "dur_long" && duration && duration < 4) return -Infinity;
        if (constraints.region && normalized.region !== this.normalizeText(constraints.region)) return -Infinity;
        if (constraints.departure_location) {
            const normDep = this.normalizeText(constraints.departure_location);
            const matched = normalized.departures.some(d => d.includes(normDep) || normDep.includes(d));
            if (!matched) return -Infinity;
        }

        // Soft scoring
        let score = 0;
        if (constraints.max_price) score += SCORE_WEIGHTS.price;
        if (constraints.duration_type) score += SCORE_WEIGHTS.duration;
        if (constraints.region) score += SCORE_WEIGHTS.region;
        if (normalizedMessage.includes(normalized.name)) score += SCORE_WEIGHTS.tour_name;
        if (normalizedMessage.includes(normalized.location)) score += SCORE_WEIGHTS.tour_location;
        if (normalized.departures.some(d => d && normalizedMessage.includes(d))) score += SCORE_WEIGHTS.departure_location;
        if (constraints.departure_location) score += SCORE_WEIGHTS.departure_bonus;
        if (price > 0 && constraints.max_price) {
            const ratio = 1 - Math.min(price / constraints.max_price, 1);
            score += Math.max(0, ratio * SCORE_WEIGHTS.price_ratio);
        }
        return score;
    }

    static buildHybridPrompt(userMessage, candidateTours) {
        const toursContext = candidateTours
            .map((tour) => {
                const deps = Array.isArray(tour.departure_locations) 
                    ? tour.departure_locations 
                    : String(tour.departure_locations || "").split("||").filter(Boolean);
                const dates = Array.isArray(tour.upcoming_dates) 
                    ? tour.upcoming_dates 
                    : String(tour.upcoming_dates || "").split(",").filter(Boolean);
                return JSON.stringify({
                    id: tour.id,
                    name: tour.name,
                    location: tour.location,
                    region: tour.region,
                    duration: tour.duration,
                    price_default: Number(tour.price_default),
                    departure_locations: deps,
                    upcoming_dates: dates,
                });
            })
            .join("\n");

        return `Bạn là tư vấn viên du lịch VietTravel. Khách hàng muốn: "${userMessage}"

DANH SÁCH TOUR ỨNG VIÊN (đã được lọc sơ bộ theo giá, miền, thời lượng, địa điểm):
${toursContext}

NHIỆM VỤ: Chọn ĐÚNG 3 tour phù hợp nhất. Trả về JSON: {"selected_tour_ids":[id1,id2,id3],"recommendation":"text"}`;
    }

    static async parseAIResponse(response) {
        try {
            const text = typeof response === "string" ? response : JSON.stringify(response || {});
            const parsed = JSON.parse(text);
            return {
                ids: Array.isArray(parsed.selected_tour_ids) 
                    ? parsed.selected_tour_ids.map(id => Number(id)).filter(Number.isInteger)
                    : [],
                recommendation: typeof parsed.recommendation === "string" && parsed.recommendation.trim()
                    ? parsed.recommendation.trim()
                    : "Dưới đây là những tour gợi ý dành cho bạn:",
            };
        } catch (error) {
            console.error("[Hybrid] Lỗi parse JSON:", error);
            return { ids: [], recommendation: "Dưới đây là những tour gợi ý dành cho bạn:" };
        }
    }

    static async getAllToursForAI() {
        try {
            const sql = `
                SELECT 
                    t.id,
                    t.name,
                    t.location,
                    t.price_default,
                    t.duration,
                    t.region,
                    t.cover_image,
                    t.description,
                    t.created_at,
                    (
                        SELECT GROUP_CONCAT(DISTINCT DATE_FORMAT(td.departure_date, '%d/%m') ORDER BY td.departure_date ASC SEPARATOR ',')
                        FROM tour_departures td
                        WHERE td.tour_id = t.id AND td.departure_date >= CURDATE()
                    ) as upcoming_dates,
                    (
                        SELECT GROUP_CONCAT(DISTINCT td.departure_location SEPARATOR '||')
                        FROM tour_departures td
                        WHERE td.tour_id = t.id
                    ) as departure_locations
                FROM tours t
                ORDER BY t.created_at DESC
            `;

            const [rows] = await db.query(sql);
            return rows.map((tour) => ({
                ...tour,
                upcoming_dates: tour.upcoming_dates || "",
                departure_locations: tour.departure_locations || "",
            }));
        } catch (error) {
            console.error("Lỗi tại getAllToursForAI:", error);
            throw new Error(`Lấy danh sách tours cho hybrid AI thất bại: ${error.message}`);
        }
    }

    static async getTourSuggestions(userMessage) {
        try {
            const allTours = await this.getAllToursForAI();
            if (allTours.length === 0) {
                return { reply: "Hiện tại hệ thống không có tour nào!", tours: [], totalCount: 0, currentPage: 1, totalPages: 0 };
            }

            const constraints = this.parseHybridConstraints(userMessage);
            
            // Filter & score
            const rankedTours = allTours
                .map(tour => ({ tour, score: this.scoreTourForSuggestion(tour, constraints) }))
                .filter(item => item.score > -Infinity)
                .sort((a, b) => 
                    b.score !== a.score ? b.score - a.score 
                    : (Number(a.tour.price_default) || 0) - (Number(b.tour.price_default) || 0)
                    || new Date(b.tour.created_at || 0) - new Date(a.tour.created_at || 0)
                )
                .map(item => item.tour);

            const candidateTours = (rankedTours.length > 0 ? rankedTours : allTours).slice(0, 10);

            // Call AI
            const prompt = this.buildHybridPrompt(userMessage, candidateTours);
            const response = await fetch(OLLAMA_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: AI_MODEL, prompt, stream: false, format: "json" }),
            }).then(r => r.json());

            const { ids: selectedIds, recommendation } = await this.parseAIResponse(response.response);
            const candidateMap = new Map(candidateTours.map(t => [t.id, t]));
            
            let selectedTours = selectedIds.map(id => candidateMap.get(id)).filter(Boolean).slice(0, 3);
            if (selectedTours.length < 3) {
                const fallback = candidateTours.filter(t => !selectedTours.some(s => s.id === t.id));
                selectedTours = [...selectedTours, ...fallback].slice(0, 3);
            }
            if (selectedTours.length === 0) {
                selectedTours = allTours.slice(0, 3);
                recommendation = "Dưới đây là 3 tour nổi bật dành cho bạn:";
            }

            return { reply: recommendation, tours: selectedTours, totalCount: candidateTours.length, currentPage: 1, totalPages: 1 };
        } catch (error) {
            console.error("Lỗi getTourSuggestions:", error);
            throw new Error(`Lấy gợi ý AI thất bại: ${error.message}`);
        }
    }
}

module.exports = ListTourService;
