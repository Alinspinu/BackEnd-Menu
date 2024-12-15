const express = require('express');
const router = express.Router();

const {authApi} = require('../../auth/auth')

const multer = require('multer');
const { storage } = require('../../cloudinary/photo-true.js');
const upload = multer({ 
    storage,   
    limits: {fieldSize: 10 * 1024 * 1024, }
 });

const productRoutes = require('../../controlers/back-office/product')

router.route('/get-products').post(productRoutes.getProducts)
router.route('/get-product').get(productRoutes.getProduct)
router.route('/prod-add', authApi)
    .post(upload.single('image'), productRoutes.addProd);
router.route('/product', authApi)
    .put(upload.single('image'), productRoutes.editProduct)
    .delete(productRoutes.delProduct);
router.route('/check-product').post(productRoutes.checkProduct);

router.route('/change-status', authApi).post(productRoutes.changeStatus);

router.route('/add-paring-product', authApi).post(productRoutes.addParingProduct);
router.route('/remove-paring-product', authApi).post(productRoutes.removeParingProduct);
router.route('/update-pro-ing-price', authApi).post(productRoutes.updateProductIngPeice)

router.route('/discount', authApi).post(productRoutes.setProductDiscount)
router.route('/disc-prod', authApi).post(productRoutes.setDiscountProd)

module.exports = router