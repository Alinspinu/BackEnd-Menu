const express = require("express");
const router = express.Router();
const test = require('../controlers/test.js')



router.route('/').get(test.updateGest)


module.exports = router