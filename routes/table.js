const express = require('express');
const router = express.Router();
const tableRoutes = require('../controlers/table')


router.route('/')
    .post(tableRoutes.addTable)
    .put(tableRoutes.editTable)
    .delete(tableRoutes.deletTable)

module.exports = router