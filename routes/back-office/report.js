const express = require('express');
const router = express.Router();
const repCont = require('./../../controlers/back-office/report.js')



router.route('/').get(repCont.getReports)
router.route('/dates').get(repCont.getReportsDates)
router.route('/all').get(repCont.getAllReports)
router.route('/update').get(repCont.updateRap)
router.route('/delete').delete(repCont.deleteReport)


module.exports = router