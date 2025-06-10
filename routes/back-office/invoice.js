const express = require('express');
const router = express.Router();
const invoiceRoutes = require('../../controlers/back-office/invoice.js')


router.route('/get-msg').get(invoiceRoutes.getMessages)
router.route('/get-invoice').get(invoiceRoutes.getInvoice)
router.route('/check').post(invoiceRoutes.checkInvoceStatus)

router.route('/get-date-msg').post(invoiceRoutes.getMessagesByDate)

router.route('/').post(invoiceRoutes.createOrderInvoice)
router.route('/save').post(invoiceRoutes.saveInvoice)




module.exports = router
