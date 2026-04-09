const Service = require('../models/Service');

exports.getAllServices = async (req, res) => {
    try {
        const services = await Service.getAll();
        res.json({
            success: true,
            data: services,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.getServiceById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID service không hợp lệ',
            });
        }

        const service = await Service.getById(id);
        if (!service) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy service',
            });
        }

        res.json({
            success: true,
            data: service,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.createService = async (req, res) => {
    try {
        const { name, slug, description, status = 1 } = req.body;

        if (!name || !slug) {
            return res.status(400).json({
                success: false,
                message: 'Tên và slug là bắt buộc',
            });
        }

        const serviceId = await Service.create({
            name,
            slug,
            description,
            status,
        });

        const createdService = await Service.getById(serviceId);

        res.status(201).json({
            success: true,
            message: 'Tạo service thành công',
            data: createdService,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.updateService = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name, slug, description, status } = req.body;

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID service không hợp lệ',
            });
        }

        const existing = await Service.getById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy service',
            });
        }

        const updated = await Service.update(id, { name, slug, description, status });
        if (!updated) {
            return res.status(500).json({
                success: false,
                message: 'Cập nhật service thất bại',
            });
        }

        const updatedService = await Service.getById(id);

        res.json({
            success: true,
            message: 'Cập nhật service thành công',
            data: updatedService,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID service không hợp lệ',
            });
        }

        const existing = await Service.getById(id);
        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy service',
            });
        }

        const deleted = await Service.delete(id);
        if (!deleted) {
            return res.status(500).json({
                success: false,
                message: 'Xóa service thất bại',
            });
        }

        res.json({
            success: true,
            message: 'Xóa service thành công',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
