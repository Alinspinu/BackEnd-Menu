const express = require('express');
const router = express.Router();
const payRoutes = require('../controlers/payment');


router.route('/get-token').get(payRoutes.getToken);
router.route('/check-cash').post(payRoutes.checkCashBack);
router.route('/check-user').get(payRoutes.checkUser);
// router.route('/pos-test').get(payRoutes.getPosToken);


module.exports = router;