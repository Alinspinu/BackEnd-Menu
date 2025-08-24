const express = require('express');
const router = express.Router();
const invCont = require('../../controlers/back-office/invetary')

router.route('/')
    .get(invCont.getInventary)
    .post(invCont.createInventary)
    .delete(invCont.deleteInventary)

router.route('/update')
    .post(invCont.updateInventary)
    .put(invCont.updateGestiune)

router.route('/compare')
    .post(invCont.compareScriptic)
    .pot(invCont.getComaredInv)


module.exports = router