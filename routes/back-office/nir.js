const express = require('express');
const router = express.Router();
const nirRoutes = require('../../controlers/back-office/nir')
const printRoutes = require('../../controlers/print')


router.route('/save-nir').post(nirRoutes.saveNir);
router.route('/print-nir').get(printRoutes.printNir);
router.route('/export-xcel').post(printRoutes.createNirsXcel)
router.route('/get-nirs').post(nirRoutes.getNirs);
router.route('/nir')
    .get(nirRoutes.getNir)
    .delete(nirRoutes.deleteNir)
router.route('/pay').post(nirRoutes.payBill)

router.route('/get-nirs-by-date')
        .post(nirRoutes.getNirsByDate)

router.route('/update').get(nirRoutes.updateIngsLogs)


module.exports = router


