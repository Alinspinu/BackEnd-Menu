const express = require('express');
const router = express.Router();
const payRoutes = require('../../controlers/payment/payment');


router.route('/get-token').get(payRoutes.getToken);
router.route('/check-cash').post(payRoutes.checkCashBack);
router.route('/check-user').get(payRoutes.checkUser);
router.route('/add-voucher').post(payRoutes.addVoucher);
router.route('/verify-voucher').post(payRoutes.checkVoucher);
router.route('/use-voucher').post(payRoutes.useVoucher);
router.route('/print-bill').post(payRoutes.printBill)
router.route('/pos').post(payRoutes.posPaymentCheck)
router.route('/reports').get(payRoutes.reports)
router.route('/in-and-out').post(payRoutes.cashInandOut)
router.route('/change-payment-method').post(payRoutes.changePaymentMethod)
router.route('/print-unreg').post(payRoutes.printUnreg)


module.exports = router;