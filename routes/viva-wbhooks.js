const express = require("express");
const router = express.Router();
const hooks = require('../controlers/viva-wbhooks')



router.route('/tr-c')
    .post(hooks.transactionCreated)
    .get(hooks.transactionCreated)

router.route('/get-accounts').get(hooks.getBankAccounts)
router.route('get-viva-data').get(hooks.getViva)

router.route('/dev').get(hooks.devWeb)


module.exports = router