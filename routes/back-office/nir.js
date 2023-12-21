const express = require('express');
const router = express.Router();
const nirRoutes = require('../../controlers/back-office/nir')
const printRoutes = require('../../controlers/print')


router.route('/save-nir').post(nirRoutes.saveNir);
router.route('/print-nir').get(printRoutes.printNir);


module.exports = router