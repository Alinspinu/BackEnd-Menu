const express = require('express');
const router = express.Router();
const apiRoutes = require('../controlers/true-api');
const multer = require('multer');
const { storage } = require('../cloudinary/photo-true.js');
const upload = multer({ storage });



router.route('/get-cats').get(apiRoutes.sendCats);
router.route('/get-tables').get(apiRoutes.sendTables);

// router.route('/cat-add')
//     .post(upload.single('image'), apiRoutes.addCat);
router.route('/prod-add')
    .post(upload.single('image'), apiRoutes.addProd);
router.route('/sub-prod-add').post(apiRoutes.saveSubProd);
router.route('/save-order').post(apiRoutes.saveOrder);
router.route('/change-status').post(apiRoutes.changeStatus);
router.route('/check-product').post(apiRoutes.checkProduct);
// router.route('/check-topping').post(apiRoutes.checkTopping);
router.route('/add-paring-product').post(apiRoutes.addParingProduct);
router.route('/remove-paring-product').post(apiRoutes.removeParingProduct);
router.route('/add-topping').post(apiRoutes.addTopping);
router.route('/update-blackList').put(apiRoutes.addToBlackList);
router.route('/get-blackList').get(apiRoutes.sendBlackList);

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