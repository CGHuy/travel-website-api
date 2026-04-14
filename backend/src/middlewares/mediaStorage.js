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

function extractCloudinaryPublicId(imageUrl) {
    if (typeof imageUrl !== "string" || imageUrl.trim() === "") {
        return "";
    }

    const uploadMarker = "/upload/";
    const markerIndex = imageUrl.indexOf(uploadMarker);
    if (markerIndex === -1) return "";

    let pathAfterUpload = imageUrl.slice(markerIndex + uploadMarker.length);
    const parts = pathAfterUpload.split("/");
    if (parts.length === 0) return "";

    if (/^v\d+$/.test(parts[0])) {
        parts.shift();
    }

    pathAfterUpload = parts.join("/");
    const dotIndex = pathAfterUpload.lastIndexOf(".");
    if (dotIndex <= 0) return pathAfterUpload;

    return pathAfterUpload.slice(0, dotIndex);
}

async function deleteFromCloudinaryByUrl(imageUrl) {
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
    deleteFromCloudinaryByUrl,
};
