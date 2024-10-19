const express = require('express');
const router = express.Router();
const suplierRoutes = require('../../controlers/back-office/suplier')

router.route('/save-suplier').post(suplierRoutes.addSuplier);
router.route('/send-supliers').post(suplierRoutes.sendSuplier);
router.route('/add-record').post(suplierRoutes.addRecord)
router.route('/get-supliers').get(suplierRoutes.getSupliers)
router.route('/remove-record').put(suplierRoutes.removeRecord)
router.route('/remove-suplier').delete(suplierRoutes.deleteSuplier)
router.route('/update-suplier').put(suplierRoutes.editSuplier)
router.route('/get-suplier').get(suplierRoutes.getSuplier)

module.exports = router