const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'placeholder',
    api_key: process.env.CLOUDINARY_API_KEY || 'placeholder',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'placeholder',
});

module.exports = cloudinary;
