const express = require('express');
const router = express.Router();
const gbt = require('../controlers/gbt')


router.route('/get-response').post(gbt.getMessage)
router.route('/cookie').post(gbt.saveCookie)
router.route('/cookie').get(gbt.getCookie)


module.exports = router