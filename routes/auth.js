const express = require('express');
const router = express.Router();
const authRoutes = require('../controlers/auth');

router.route('/verify-token').post(authRoutes.verifyToken);
router.route('/send-reset-email').post(authRoutes.sendEmailResetPassword);
router.route('/reset-password').post(authRoutes.resetPassword);
router.route('/register').post(authRoutes.register);
router.route('/login').post(authRoutes.login);

module.exports = router;