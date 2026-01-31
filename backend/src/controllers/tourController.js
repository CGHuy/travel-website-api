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