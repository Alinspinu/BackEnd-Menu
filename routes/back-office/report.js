const express = require('express');
const router = express.Router();
const repCont = require('./../../controlers/back-office/report.js')



router.route('/').get(repCont.getReports)
router.route('/dates').get(repCont.getReportsDates)
router.route('/all')
    .get(repCont.getAllReports)
    .delete(repCont.deleteReports)
router.route('/update').get(repCont.updateRap)
router.route('/delete').delete(repCont.deleteReport)

router.route('/survey')
    .get(repCont.getSurveys)
    .post(repCont.addSurvey)
    .put(repCont.editSurvey)

router.route('/get-survey').get(repCont.getSurvey)


module.exports = router