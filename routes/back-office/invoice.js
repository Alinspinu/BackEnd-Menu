const express = require('express');
const router = express.Router();
const invoiceRoutes = require('../../controlers/back-office/invoice.js')


router.route('/get-msg').get(invoiceRoutes.getMessages)
router.route('/get-invoice').get(invoiceRoutes.getInvoice)
router.route('/check')
    .get(invoiceRoutes.checkInvoiceUploadStatus)
    .post(invoiceRoutes.checkInvoceStatus)

router.route('/get-date-msg').post(invoiceRoutes.getMessagesByDate)

router.route('/')
    .get(invoiceRoutes.getInvoices)
    .put(invoiceRoutes.editInvoice)
    .post(invoiceRoutes.createOrderInvoice)
    .delete(invoiceRoutes.deleteInvoice)

router.route('/upload').post(invoiceRoutes.uploadInvoiceToEFactura)

router.route('/save').post(invoiceRoutes.saveInvoice)




module.exports = router
