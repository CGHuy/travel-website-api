const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Cấu hình CloudinaryStorage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "travel-website", // Thư mục trên Cloudinary
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        resource_type: "auto",
    },
});

// Middleware upload với xác thực file
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // Giới hạn 5MB
    },
    fileFilter: (req, file, cb) => {
        // Kiểm tra loại file
        const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, gif, webp)"));
        }
    },
});

module.exports = upload;
