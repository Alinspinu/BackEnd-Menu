const express = require("express");
const router = express.Router();
const test = require('../controlers/tst.js')



router.route('/').get(test.updateGest)


module.exports = router