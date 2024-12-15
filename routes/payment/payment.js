const express = require('express');
const router = express.Router();
const payRoutes = require('../../controlers/payment/payment');

const {authApi} = require('../../auth/auth')


router.route('/get-token').get(payRoutes.getToken);
router.route('/check-cash').post(payRoutes.checkCashBack);
router.route('/check-user').get(payRoutes.checkUser);
router.route('/add-voucher', authApi).post(payRoutes.addVoucher);
router.route('/verify-voucher', authApi).post(payRoutes.checkVoucher);
router.route('/use-voucher', authApi).post(payRoutes.useVoucher);
router.route('/print-bill', authApi).post(payRoutes.printBill)
router.route('/pos', authApi).post(payRoutes.posPaymentCheck)
router.route('/reports', authApi).get(payRoutes.reports)
router.route('/in-and-out', authApi).post(payRoutes.cashInandOut)
router.route('/change-payment-method', authApi).post(payRoutes.changePaymentMethod)
router.route('/print-unreg', authApi).post(payRoutes.printUnreg)
router.route('/save-bill-cloud', authApi).post(payRoutes.saveBillInCloud)
router.route('/reprint-fiscal', authApi).post(payRoutes.reprinFiscal)

// router.route('/pos2').get(payRoutes.getTokenForPos)


module.exports = router;