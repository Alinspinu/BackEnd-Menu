const express = require('express');
const router = express.Router();

const multer = require('multer');
const { storage } = require('../../cloudinary/photo-true.js');
const upload = multer({ storage });

const productRoutes = require('../../controlers/back-office/product')

router.route('/get-products').post(productRoutes.getProducts)
router.route('/get-product').get(productRoutes.getProduct)
router.route('/prod-add')
    .post(upload.single('image'), productRoutes.addProd);
router.route('/product')
    .put(upload.single('image'), productRoutes.editProduct)
    .delete(productRoutes.delProduct);
router.route('/check-product').post(productRoutes.checkProduct);

router.route('/change-status').post(productRoutes.changeStatus);

router.route('/add-paring-product').post(productRoutes.addParingProduct);
router.route('/remove-paring-product').post(productRoutes.removeParingProduct);

router.route('/discount').post(productRoutes.setProductDiscount)

module.exports = router