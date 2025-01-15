const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const crypto = require('crypto');
const {generateSoketId} = require('../utils/functions')


function generateSignature(paramsToSign) {
    const cloudinarySecret = process.env.CLOUDINARY_SECRET;
    const stringToSign = Object.keys(paramsToSign)
        .sort()
        .map(key => `${key}=${paramsToSign[key]}`)
        .join('&');
    return crypto
        .createHash('sha1')
        .update(stringToSign + cloudinarySecret)
        .digest('hex');
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});


const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp
        const paramsToSign = {
            folder: 'uploads', // The folder name
            timestamp: timestamp,
            transformation: [{ width: 555, height: 888, crop: "fill" }],
            public_id: (req, file) => 'sadkjh342aiweqqwe',
        };
        const signature = generateSignature(paramsToSign);

        return {
            folder: 'uploads',
            transformation: [{ width: 555, height: 888, crop: "fill" }],
            allowed_formats: ['jpeg', 'png', 'jpg', 'mp4'],
            resource_type: 'auto',
            timestamp: timestamp,
            signature: signature,
            public_id: (req, file) => 'sadkjh342aiweqqwe',
        };
    }
});



// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: {
//         folder: 'uploads',
//         transformation: [
//             { width: 555, height: 888, crop: "fill" }
//         ],
//         allowedForms: ['jpeg', 'png', 'jpg', 'mp4'],
//         resource_type: 'auto',
//         public_id: (req, file) => generateSoketId(12),
//     }
// });


module.exports = { cloudinary, storage };