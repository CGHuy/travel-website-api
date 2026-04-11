const Tour = require("../models/Tour");
const Service = require("../models/Service");
const TourService = require("../models/TourService");

class TourServiceController {
    // GET /api/tour-services/tours?q=...
    static async getToursForServiceManagement(req, res, next) {
        try {
            const q = String(req.query.q || "")
                .trim()
                .toLowerCase();
            const tours = await Tour.getAll();
            const serviceRows = await Service.getAll();
            const activeServiceIds = new Set(serviceRows.filter((service) => Number(service.status) === 1).map((service) => Number(service.id)));

            const withCounts = await Promise.all(
                tours.map(async (tour) => {
                    const linked = await TourService.getByTourId(tour.id);
                    const serviceCount = linked.filter((link) => activeServiceIds.has(Number(link.service_id))).length;
                    return {
                        id: tour.id,
                        code: `TOUR${String(tour.id).padStart(3, "0")}`,
                        name: tour.name || "",
                        destination: tour.location || "",
                        serviceCount,
                        hasServices: serviceCount > 0,
                    };
                }),
            );

            const data = withCounts.filter((tour) => {
                if (!q) return true;
                return `${tour.id} ${tour.code} ${tour.name} ${tour.destination}`.toLowerCase().includes(q);
            });

            return res.json({ success: true, data, total: data.length });
        } catch (error) {
            return next(error);
        }
    }

    // GET /api/tour-services/:tourId
    static async getServicesByTourId(req, res, next) {
        try {
            const tourId = Number(req.params.tourId);
            if (!Number.isInteger(tourId) || tourId <= 0) {
                return res.status(400).json({ success: false, message: "tourId không hợp lệ" });
            }

            const tour = await Tour.getById(tourId);
            if (!tour) {
                return res.status(404).json({ success: false, message: "Không tìm thấy tour" });
            }

            const serviceRows = await Service.getAll();

            const selectedLinks = await TourService.getByTourId(tourId);
            const selectedSet = new Set(selectedLinks.map((x) => Number(x.service_id)));

            const services = serviceRows
                .filter((s) => Number(s.status) === 1)
                .map((s) => ({
                    id: s.id,
                    code: `SV${String(s.id).padStart(3, "0")}`,
                    name: s.name || "",
                    description: s.description || "",
                    checked: selectedSet.has(Number(s.id)),
                }));

            return res.json({
                success: true,
                data: {
                    tour: {
                        id: tour.id,
                        code: `TR${String(tour.id).padStart(3, "0")}`,
                        name: tour.name || "",
                    },
                    services,
                },
            });
        } catch (error) {
            return next(error);
        }
    }

    // PUT /api/tour-services/:tourId
    static async updateTourServices(req, res, next) {
        try {
            const tourId = Number(req.params.tourId);
            if (!Number.isInteger(tourId) || tourId <= 0) {
                return res.status(400).json({ success: false, message: "tourId không hợp lệ" });
            }

            const serviceIdsRaw = Array.isArray(req.body.serviceIds) ? req.body.serviceIds : [];
            const serviceIds = [...new Set(serviceIdsRaw.map(Number).filter((id) => Number.isInteger(id) && id > 0))];

            const tour = await Tour.getById(tourId);
            if (!tour) {
                return res.status(404).json({ success: false, message: "Không tìm thấy tour" });
            }

            await TourService.deleteByTourId(tourId);

            for (const serviceId of serviceIds) {
                await TourService.create({ tour_id: tourId, service_id: serviceId });
            }

            return res.json({
                success: true,
                message: "Cập nhật dịch vụ thành công",
                data: { tourId, serviceIds },
            });
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = TourServiceController;
