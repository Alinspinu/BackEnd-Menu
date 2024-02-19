const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});



const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'gossip',
        transformation: [
            { width: 444, height: 333, crop: "fill" }
        ],
        allowedForms: ['jpeg', 'png', 'jpg', 'mp4'],
        resource_type: 'auto'
    }
});


module.exports = { cloudinary, storage };