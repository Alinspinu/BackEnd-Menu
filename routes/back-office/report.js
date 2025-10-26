const express = require('express');
const router = express.Router();
const repCont = require('./../../controlers/back-office/report.js')



router.route('/')
    .get(repCont.getReports)
    .post(repCont.saveReport)
router.route('/id').get(repCont.getReportById)
router.route('/dates').get(repCont.getReportsDates)
router.route('/all')
    .get(repCont.getAllReports)
    .delete(repCont.deleteReports)
router.route('/all-period').get(repCont.getPeriodReports)
router.route('/update').get(repCont.updateRap)
router.route('/delete').delete(repCont.deleteReport)
router.route('/last').get(repCont.getLastReport)
router.route('/survey')
    .get(repCont.getSurveys)
    .post(repCont.addSurvey)
    .put(repCont.editSurvey)

router.route('/get-survey').get(repCont.getSurvey)


module.exports = router