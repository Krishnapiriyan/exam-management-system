const r2Client = require('../utils/s3');
const multer = require('multer');
const multerS3 = require('multer-s3');

const storage = multerS3({
    s3: r2Client,
    bucket: process.env.R2_BUCKET_NAME,
    key: function (req, file, cb) {
        const fileExtension = file.originalname.split('.').pop();
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `site-media/${uniqueSuffix}.${fileExtension}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB cap
});

module.exports = upload;
