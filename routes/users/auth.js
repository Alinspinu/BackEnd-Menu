const express = require('express');
const router = express.Router();
const authRoutes = require('../../controlers/users/auth');
const usersCont = require('../../controlers/users/users')

router.route('/verify-token').post(authRoutes.verifyToken);
router.route('/send-reset-email').post(authRoutes.sendEmailResetPassword);
router.route('/reset-password').post(authRoutes.resetPassword);
router.route('/register').post(authRoutes.register);
router.route('/login').post(authRoutes.login);
router.route('/register-employee').post(authRoutes.registerEmployee)
router.route('/loc').get(authRoutes.getLoc)

router.route('/register-in').post(authRoutes.registerIn)
router.route('/new-employee').post(authRoutes.registerNewEmployee)

router.route('/verify-employee-token').post(authRoutes.verifyEmployeeToken)

router.route('/checkIn').post(authRoutes.checkInOrOut)
router.route('/horoscop').get(authRoutes.getHoroscop)

router.route('/update-user-data').post(authRoutes.updateUserData)

router.route('/send-log').post(authRoutes.sendLogs)

router.route('/ss23').get(usersCont.getServers)



router.route('/otp')
    .get(authRoutes.resendOTP)
    .post(authRoutes.verifyOTP)

router.route('/sale-point')
    .get(authRoutes.getSalePoints)
    .post(authRoutes.addSalePoint)
    .delete(authRoutes.deleteSalePoint)

router.route('/ct')
    .get(authRoutes.encodeUserID)
    .post(authRoutes.decodeUserToken)


// router.route('/new-user').get(authRoutes.newUser)


module.exports = router;