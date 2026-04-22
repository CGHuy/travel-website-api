const multer = require("multer");
const cloudinary = require("../config/cloudinary");

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIMES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

const upload = multer({ // Sử dụng memory storage để lưu file tạm thời trong bộ nhớ
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
    fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIMES.has(file.mimetype)) {
            return cb(new Error("Chỉ chấp nhận file ảnh (jpg, png, gif, webp)"));
        }
        return cb(null, true);
    },
});

function uploadBufferToCloudinary(buffer) { // Trả về một Promise để dễ dàng sử dụng async/await
    return new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream(
                {
                    folder: "travel-website",
                    resource_type: "image",
                },
                (error, result) => (error ? reject(error) : resolve(result)),
            )
            .end(buffer);
    });
}

exports.single = function buildUploadMiddleware(fieldName) { // Trả về middleware để xử lý upload file
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
};

function extractCloudinaryPublicId(imageUrl) { // Trích xuất public_id từ URL Cloudinary
    if (typeof imageUrl !== "string" || imageUrl.trim() === "") {
        return "";
    }

    const uploadMarker = "/upload/";
    const markerIndex = imageUrl.indexOf(uploadMarker);
    if (markerIndex === -1) return "";

    return imageUrl
        .slice(markerIndex + uploadMarker.length)
        .replace(/^v\d+\//, "")
        .replace(/\.[^/.?#]+(?:[?#].*)?$/, "");
}

exports.deleteFromCloudinaryByUrl = async function deleteFromCloudinaryByUrl(imageUrl) { // Xóa file khỏi Cloudinary dựa trên URL
    const publicId = extractCloudinaryPublicId(imageUrl);
    if (!publicId) {
        return { ok: false, reason: "empty-public-id" };
    }

    const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
    });

    return {
        ok: result && (result.result === "ok" || result.result === "not found"),
        result,
    };
};
