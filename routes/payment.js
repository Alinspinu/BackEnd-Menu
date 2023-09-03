const express = require('express');
const router = express.Router();
const payRoutes = require('../controlers/payment');


router.route('/get-token').get(payRoutes.getToken);
router.route('/check-cash').post(payRoutes.checkCashBack);
router.route('/check-user').get(payRoutes.checkUser);


module.exports = router;