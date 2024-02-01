const express = require('express');
const router = express.Router();
const tableRoutes = require('../../controlers/back-office/table')


router.route('/')
    .post(tableRoutes.addTable)
    .put(tableRoutes.editTable)
    .delete(tableRoutes.deletTable)

router.route('/get-tables').get(tableRoutes.sendTables);
router.route('/get-order-message').get(tableRoutes.sendLiveOrders)

module.exports = router