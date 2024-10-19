const express = require('express');
const router = express.Router();
const regRoutes = require('../../controlers/back-office/cash-register')

router.route('/show-cash-register').get(regRoutes.sendEntry)
router.route('/create-xcel').post(regRoutes.createXcel)
router.route('/add-entry').post(regRoutes.addEntry)
router.route('/delete-entry').delete(regRoutes.deleteEntry)
router.route('/get-days').post(regRoutes.showDocs)
// router.route('/create').get(regRoutes.creataDaty)

module.exports = router
