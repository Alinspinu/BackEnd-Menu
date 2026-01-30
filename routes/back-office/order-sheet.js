const express = require('express');
const router = express.Router();
const orderRoutes = require('../../controlers/back-office/order-sheet')



router.route('/')
        .get(orderRoutes.getSheet)
        .post(orderRoutes.addOrder)
        .put(orderRoutes.updateSheet)
        .delete(orderRoutes.deleteSheet)


module.exports = router