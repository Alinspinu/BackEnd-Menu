const express = require('express');
const router = express.Router();

const ingRoutes = require('../../controlers/back-office/ing')

router.route('/search-ingredients').post(ingRoutes.searchIng)
router.route('/save-ingredient').post(ingRoutes.saveIng)




module.exports = router