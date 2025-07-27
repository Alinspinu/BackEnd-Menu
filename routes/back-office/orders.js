const express = require('express');
const router = express.Router();
const orderRoutes = require('../../controlers/back-office/orders')
const {authApi} = require('../../auth/auth')

router.route('/get-orders', authApi).post(orderRoutes.getOrder);
router.route('/get-havy-orders', authApi).post(orderRoutes.getHavyOrders)
router.route('/get-user-orders', authApi).get(orderRoutes.getOrderByUser)
router.route('/get-ice-orders', authApi).post(orderRoutes.getIceCreamOrders)

router.route('/order-done').get(orderRoutes.orderDone);
router.route('/set-order-time').get(orderRoutes.setOrderTime);
router.route('/pending').post(orderRoutes.endPending);
router.route('/finished-orders').get(orderRoutes.getOrderDone);
router.route('/move').post(orderRoutes.changeBillTable)

router.route('/client').get(orderRoutes.getClientOrders)

router.route('/get-time').get(orderRoutes.sendOrderTime);
router.route('/bill', authApi)
    .post(orderRoutes.saveOrEditBill)
    .put(orderRoutes.deleteOrder)
router.route('/register-del-prod', authApi).post(orderRoutes.registerDeletedOrderProducts)
router.route('/save-order')
    .post(orderRoutes.saveOrder)
router.route('/upload-ings', authApi).post(orderRoutes.uploadIngs)
router.route('/unload-ings', authApi).post(orderRoutes.unloadIngs)


router.route('/all-orders', authApi).get(orderRoutes.getAllOrders)

router.route('/dep', authApi).get(orderRoutes.calcDep)

router.route('/test-rep').get(orderRoutes.testRaport)

router.route('/reset-counter').get(orderRoutes.resetOrderCounter)

// router.route('/fix-bull').get(orderRoutes.fixBul)

// router.route('/update-bills').get(orderRoutes.updateProducts)


module.exports = router  