const express = require('express');
const router = express.Router();
const repCont = require('./../../controlers/back-office/report.js')



router.route('/').get(repCont.getReports)
router.route('/update').get(repCont.updateRap)


module.exports = router