const express = require('express');
const router = express.Router();
const suplierRoutes = require('../../controlers/back-office/suplier')

router.route('/save-suplier').post(suplierRoutes.addSuplier);
router.route('/send-supliers').post(suplierRoutes.sendSuplier);

module.exports = router