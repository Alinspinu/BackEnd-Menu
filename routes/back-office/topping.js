const express = require('express');
const router = express.Router();
const topRoutes = require('../../controlers/back-office/topping');


router.route('/add-topping').post(topRoutes.addTopping);

router.route('/update-blackList').put(topRoutes.addToBlackList);
router.route('/get-blackList').get(topRoutes.sendBlackList);


module.exports = router;