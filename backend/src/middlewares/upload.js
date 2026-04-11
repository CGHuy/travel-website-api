const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const upload = multer({
    storage: multer.memoryStorage(),
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

function uploadBufferToCloudinary(buffer) {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "travel-website",
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);
                return resolve(result);
            },
        );

        stream.end(buffer);
    });
}

function buildUploadMiddleware(fieldName) {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, async (err) => {
            if (err) return next(err);
            if (!req.file || !req.file.buffer) return next();

            try {
                const result = await uploadBufferToCloudinary(req.file.buffer);
                req.file.path = result.secure_url;
                req.file.filename = result.public_id;
                req.file.cloudinary = result;
                next();
            } catch (uploadError) {
                next(uploadError);
            }
        });
    };
}

module.exports = {
    single: buildUploadMiddleware,
};
