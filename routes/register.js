const express = require('express');
const router = express.Router();
const regRoutes = require('../controlers/register')

router.route('/show-cash-register').get(regRoutes.sendEntry)
router.route('/create-xcel').get(regRoutes.createXcel)
router.route('/add-entry').post(regRoutes.addEntry)
router.route('/delete-entry').delete(regRoutes.deleteEntry)

module.exports = router