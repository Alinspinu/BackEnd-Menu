const express = require('express');
const router = express.Router();
const invoiceRoutes = require('../../controlers/back-office/invoice/controlers.js')
const printRoutes = require('../../controlers/print/print.js');
const reciptRoutes = require('../../controlers/back-office/invoice/recipt.js')



router.route('/get-msg').get(invoiceRoutes.getMessages)
router.route('/get-invoice').get(invoiceRoutes.getInvoice)
router.route('/check')
    .get(invoiceRoutes.checkInvoiceUploadStatus)
    .post(invoiceRoutes.checkInvoceStatus)

router.route('/get-date-msg').post(invoiceRoutes.getMessagesByDate)

router.route('/client').get(invoiceRoutes.getInvoicesByClient)

router.route('/')
    .get(invoiceRoutes.getInvoices)
    .put(invoiceRoutes.editInvoice)
    .post(invoiceRoutes.createOrderInvoice)
    .delete(invoiceRoutes.deleteInvoice)

router.route('/upload').post(invoiceRoutes.uploadInvoiceToEFactura)

router.route('/save').post(invoiceRoutes.saveInvoice)

router.route('/print').post(printRoutes.factura)

router.route('/errors').get(invoiceRoutes.handleUplodErros)

router.route('/credit-note').post(invoiceRoutes.uploadCreditNoteToEFactura)



router.route('/recipt')
    .get(reciptRoutes.getRecipts)
    .post(reciptRoutes.addRecipt)
    .put(reciptRoutes.editReipt)
    .delete(reciptRoutes.deleteRecipt)

router.route('/print-recipt').post(printRoutes.printOrEmailRecipt)



module.exports = router
