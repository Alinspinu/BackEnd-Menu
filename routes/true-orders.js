const express = require('express');
const router = express.Router();
const comenzi = require('../controlers/true-orders')

router.route('/get-order').get(comenzi.getOrder);
router.route('/order-done').get(comenzi.orderDone);
router.route('/set-order-time').get(comenzi.setOrderTime);
router.route('/order-pending').get(comenzi.endPending);
router.route('/finished-orders').get(comenzi.getOrderDone);




module.exports = router  