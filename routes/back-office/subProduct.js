const express = require('express');
const router = express.Router();

const multer = require('multer');
const { storage } = require('../../cloudinary/photo-true.js');
const upload = multer({ storage });

const subRoutes = require('../../controlers/back-office/subProduct')

router.route('/sub-product')
    .post(subRoutes.saveSubProd)
    .put(subRoutes.editSubproduct)
    .delete(subRoutes.delSubProduct)

module.exports = router