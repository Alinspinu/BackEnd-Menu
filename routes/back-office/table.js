const express = require('express');
const router = express.Router();
const tableRoutes = require('../../controlers/back-office/table')


router.route('/')
    .post(tableRoutes.addTable)
    .put(tableRoutes.editTable)
    .delete(tableRoutes.deleteTable)

router.route('/area')
    .get(tableRoutes.getArea)
    .post(tableRoutes.createArea)
    .put(tableRoutes.editArea)
    .delete(tableRoutes.deleteArea)

router.route('/get-tables').get(tableRoutes.sendTables);


module.exports = router