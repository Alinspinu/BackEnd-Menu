const express = require('express');
const router = express.Router();
const repCont = require('./../../controlers/back-office/report.js')



router.route('/').get(repCont.getReports)


module.exports = router