const express = require('express');
const router = express.Router();
const comenzi = require('../controlers/true-orders')

router.route('/recive-order').get(comenzi.sendLiveOrders)
router.route('/get-order').get(comenzi.getOrder)
router.route('/order-done').get(comenzi.orderDone)
router.route('/').get(comenzi.renderTrueOrders)


module.exports = router  