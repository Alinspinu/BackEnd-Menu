const express = require('express');
const router = express.Router();
const orderRoutes = require('../../controlers/back-office/orders')

router.route('/get-order').get(orderRoutes.getOrder);
router.route('/order-done').get(orderRoutes.orderDone);
router.route('/set-order-time').get(orderRoutes.setOrderTime);
router.route('/order-pending').get(orderRoutes.endPending);
router.route('/finished-orders').get(orderRoutes.getOrderDone);

router.route('/get-time').get(orderRoutes.sendOrderTime);
router.route('/bill')
    .post(orderRoutes.saveOrEditBill)
    .put(orderRoutes.deleteOrder)
router.route('/register-del-prod').post(orderRoutes.registerDeletedOrderProducts)
router.route('/save-order')
    .post(orderRoutes.saveOrder)
router.route('/upload-ings').post(orderRoutes.uploadIngs)


module.exports = router  