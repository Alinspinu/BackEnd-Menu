const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');



cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});


// const storage = new CloudinaryStorage({
//     cloudinary: cloudinary,
//     params: async (req, file) => {
//         const timestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp
//         const paramsToSign = {
//             folder: 'uploads', // The folder name
//             timestamp: timestamp,
//             transformation: [{ width: 555, height: 888, crop: "fill" }],
//             public_id: (req, file) => `user-${req.user.id}-${Date.now()}`,
//         };
//         const signature = generateSignature(paramsToSign);
//         console.log('Cloudinary Params:', { ...paramsToSign, api_key: process.env.CLOUDINARY_KEY, signature });
//         return {
//             folder: 'uploads',
//             transformation: [{ width: 555, height: 888, crop: "fill" }],
//             allowed_formats: ['jpeg', 'png', 'jpg', 'mp4'],
//             resource_type: 'auto',
//             public_id: (req, file) => `user-${req.user.id}-${Date.now()}`,
//             api_key: process.env.CLOUDINARY_KEY,
//             timestamp: timestamp,
//             signature: signature,
//         };
//     }
// });



const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'true',
        transformation: [
            { width: 555, height: 888, crop: "fill" }
        ],
        allowedForms: ['jpeg', 'png', 'jpg', 'mp4'],
        resource_type: 'auto',
    }
});


module.exports = { cloudinary, storage };