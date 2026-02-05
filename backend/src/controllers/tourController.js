const Tour = require('../models/Tour');

exports.getAllTours = async (req, res) => {
     try {
          const tours = await Tour.getAll();
          res.json({
               success: true,
               data: tours
          });
     } catch (error) {
          res.status(500).json({
               success: false,
               message: error.message
          });
     }
};

// Tìm kiếm tours
exports.searchTours = async (req, res) => {
     try {
          const keyword = (req.query.keyword || req.query.q || '').toString().trim();

          if (!keyword) {
               return res.status(400).json({
                    success: false,
                    message: 'Vui lòng nhập từ khóa tìm kiếm'
               });
          }

          const tours = await Tour.search(keyword);
          res.json({
               success: true,
               data: tours
          });
     } catch (error) {
          res.status(500).json({
               success: false,
               message: error.message
          });
     }
};

// Lấy tours theo region
exports.getToursByRegion = async (req, res) => {
     try {
          const region = (req.params.region || '').toString().trim();

          if (!region) {
               return res.status(400).json({
                    success: false,
                    message: 'Vùng miền không hợp lệ'
               });
          }

          const tours = await Tour.getByRegion(region);
          res.json({
               success: true,
               data: tours
          });
     } catch (error) {
          res.status(500).json({
               success: false,
               message: error.message
          });
     }
};

// Lấy tour theo ID
exports.getTourById = async (req, res) => {
     try {
          const id = parseInt(req.params.id);

          if (isNaN(id)) {
               return res.status(400).json({
                    success: false,
                    message: 'ID tour không hợp lệ'
               });
          }

          const tour = await Tour.getById(id);
          if (!tour) {
               return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy tour'
               });
          }

          res.json({
               success: true,
               data: tour
          });
     } catch (error) {
          res.status(500).json({
               success: false,
               message: error.message
          });
     }
};

// Tạo tour mới
exports.createTour = async (req, res) => {
     try {
          const { name, description, price, region, duration, image } = req.body;

          const tourId = await Tour.create({
               name,
               description,
               price,
               region,
               duration,
               image: image || null
          });

          const createdTour = await Tour.getById(tourId);

          res.status(201).json({
               success: true,
               message: 'Tạo tour thành công',
               data: createdTour
          });
     } catch (error) {
          res.status(500).json({
               success: false,
               message: error.message
          });
     }
};

// Cập nhật tour
exports.updateTour = async (req, res) => {
     try {
          const id = parseInt(req.params.id);

          if (isNaN(id)) {
               return res.status(400).json({
                    success: false,
                    message: 'ID tour không hợp lệ'
               });
          }

          const { name, description, price, region, duration, image } = req.body;

          const updated = await Tour.update(id, {
               name,
               description,
               price,
               region,
               duration,
               image: image || null
          });

          if (!updated) {
               return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy tour'
               });
          }

          const updatedTour = await Tour.getById(id);

          res.json({
               success: true,
               message: 'Cập nhật tour thành công',
               data: updatedTour
          });
     } catch (error) {
          res.status(500).json({
               success: false,
               message: error.message
          });
     }
};

// Xóa tour
exports.deleteTour = async (req, res) => {
     try {
          const id = parseInt(req.params.id);

          if (isNaN(id)) {
               return res.status(400).json({
                    success: false,
                    message: 'ID tour không hợp lệ'
               });
          }

          const deleted = await Tour.delete(id);

          if (!deleted) {
               return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy tour'
               });
          }

          res.json({
               success: true,
               message: 'Xóa tour thành công'
          });
     } catch (error) {
          res.status(500).json({
               success: false,
               message: error.message
          });
     }
};