const Service = require('../models/Service');

exports.getAllServices=async(req,res) => {
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
}
