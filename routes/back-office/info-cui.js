const express = require('express');
const router = express.Router();
const infoCont = require('../../controlers/back-office/info-cui')


router.route('/').get(infoCont.getComapnyData)


module.exports = router