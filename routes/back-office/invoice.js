const express = require('express');
const router = express.Router();
const invoiceRoutes = require('../../controlers/back-office/invoice.js')


router.route('/').get(invoiceRoutes.getTokenCallBack)
router.route('/get-token').get(invoiceRoutes.getToken)



module.exports = router
