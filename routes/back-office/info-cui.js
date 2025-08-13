const express = require('express');
const router = express.Router();
const infoCont = require('../../controlers/back-office/info-cui')


router.route('/')
    .get(infoCont.getComapnyData)
    .post(infoCont.getClientAddress)


module.exports = router