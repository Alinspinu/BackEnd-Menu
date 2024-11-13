const express = require('express');
const router = express.Router();
const authRoutes = require('../../controlers/users/auth');

const multer = require('multer');
const storage  = multer.memoryStorage();
const upload = multer({storage: storage});

router.route('/verify-token').post(authRoutes.verifyToken);
router.route('/send-reset-email').post(authRoutes.sendEmailResetPassword);
router.route('/reset-password').post(authRoutes.resetPassword);
router.route('/register').post(authRoutes.register);
router.route('/login').post(authRoutes.login);
router.route('/register-employee').post(authRoutes.registerEmployee)
router.route('/loc').get(authRoutes.getLoc)

router.route('/register-in').post(upload.single('image'), authRoutes.registerIn)

// router.route('/new-user').get(authRoutes.newUser)


module.exports = router;