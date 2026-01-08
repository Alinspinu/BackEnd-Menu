const express = require('express');
const router = express.Router();
const nirRoutes = require('../../controlers/back-office/nir')
const printRoutes = require('../../controlers/print/print')


router.route('/save-nir').post(nirRoutes.saveNir);
router.route('/print-nir').get(printRoutes.printNir);
router.route('/export-xcel').post(nirRoutes.printNirsList)
router.route('/get-nirs')
        .post(nirRoutes.getNirs)
        .get(nirRoutes.getNirsBySuplier)
router.route('/nir')
    .get(nirRoutes.getNir)
    .delete(nirRoutes.deleteNir)
    .post(nirRoutes.printNirByIngLogId)
    
router.route('/pay').post(nirRoutes.payBill)

router.route('/delete-nirs').put(nirRoutes.deleteNirs)

router.route('/get-nirs-by-date')
        .post(nirRoutes.getNirsByDate)

router.route('/print-nirs-invoices').post(nirRoutes.printNirsAndInvoices)

router.route('/update')
    .get(nirRoutes.updateIngsLogs)
    .post(nirRoutes.paySuplierBill)
    .put(nirRoutes.addEFacturaID)

router.route('/sheet')
    .get(nirRoutes.getSheets)
    .post(nirRoutes.addImpSheet)
    .delete(nirRoutes.deleteSheet)
    .put(nirRoutes.printSheet)

router.route('/sheets').put(nirRoutes.printSheets)

 router.route('/order-sheet').post(nirRoutes.createSheetByOrder)

router.route('/nir-invoice')
    .get(nirRoutes.printNirInvoice)
    .post(nirRoutes.seaveNirInvoice)

// router.route('/fix').get(nirRoutes.fixBuleala)

router.route('/production-sheet')
        .get(nirRoutes.getProductionSheets)
        .post(nirRoutes.addProductionSheet)
        .delete(nirRoutes.deleteProductionSheet)

router.route('/transfer')
    .get(nirRoutes.getTransfers)
    .post(nirRoutes.addTransfer)
    .put(nirRoutes.editTransfer)
    .delete(nirRoutes.deleteTransfer)

router.route('/make-tr').post(nirRoutes.makeTransfer)

    

router.route('/sheet-period').get(nirRoutes.getSheetsByPeriod)

module.exports = router


