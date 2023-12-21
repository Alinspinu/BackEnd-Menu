const express = require('express');
const router = express.Router();
const payRoutes = require('../../controlers/payment/payment');


router.route('/get-token').get(payRoutes.getToken);
router.route('/check-cash').post(payRoutes.checkCashBack);
router.route('/check-user').get(payRoutes.checkUser);
router.route('/add-voucher').post(payRoutes.addVoucher);
router.route('/verify-voucher').post(payRoutes.checkVoucher);
router.route('/use-voucher').post(payRoutes.useVoucher);



module.exports = router;