const express = require('express');
const router = express.Router();
const orderRoutes = require('../../controlers/back-office/orders')
const printRoutes = require('../../controlers/print')

router.route('/get-orders').post(orderRoutes.getOrder);
router.route('/get-havy-orders').post(orderRoutes.getHavyOrders)
router.route('/get-user-orders').get(orderRoutes.getOrderByUser)

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

router.route('/invoice').post(printRoutes.factura)

router.route('/all-orders').get(orderRoutes.getAllOrders)

router.route('/dep').get(orderRoutes.calcDep)

// router.route('/update-bills').get(orderRoutes.updateProducts)


module.exports = router  