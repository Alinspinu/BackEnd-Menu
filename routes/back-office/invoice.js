const express = require('express');
const router = express.Router();
const invoiceRoutes = require('../../controlers/back-office/invoice.js')


router.route('/get-data').get(invoiceRoutes.getInvoices)




module.exports = router
