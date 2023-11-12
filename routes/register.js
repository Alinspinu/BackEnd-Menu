const express = require('express');
const router = express.Router();
const regRoutes = require('../controlers/register')

router.route('/show-cash-register').get(regRoutes.sendEntry)
router.route('/create-xcel').get(regRoutes.createXcel)

module.exports = router