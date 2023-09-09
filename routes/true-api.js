const express = require('express');
const router = express.Router();
const apiRoutes = require('../controlers/true-api');
const multer = require('multer');
const { storage } = require('../cloudinary/photo-true.js');
const upload = multer({ storage });



router.route('/get-cats').get(apiRoutes.sendCats);
// router.route('/get-cat').get(apiRoutes.sendCat);

// router.route('/cat-add')
//     .post(upload.single('image'), apiRoutes.addCat);
router.route('/prod-add')
    .post(upload.single('image'), apiRoutes.addProd);
router.route('/sub-prod-add').post(apiRoutes.saveSubProd);
router.route('/save-order').post(apiRoutes.saveOrder);
router.route('/change-status').post(apiRoutes.changeStatus);
router.route('/check-product').post(apiRoutes.checkProduct);
router.route('/add-paring-product').post(apiRoutes.addParrinProducts)

router.route('/cat')
    // .put(upload.single('image'), apiRoutes.editCategory)
    .delete(apiRoutes.delCategory);
router.route('/product')
    .put(upload.single('image'), apiRoutes.editProduct)
    .delete(apiRoutes.delProduct);
router.route('/sub-product')
    .put(apiRoutes.editSubproduct)
    .delete(apiRoutes.delSubProduct);
router.route('/get-time').get(apiRoutes.sendOrderTime);


module.exports = router;