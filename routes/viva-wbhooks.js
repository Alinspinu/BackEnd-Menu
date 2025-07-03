const express = require("express");
const router = express.Router();
const hooks = require('../controlers/viva-wbhooks')



router.route('/tr-c')
    .post(hooks.transactionCreated)
    .get(hooks.transactionCreated)


module.exports = router