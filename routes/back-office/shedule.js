const express = require('express');
const router = express.Router();
const sheduleRoutes = require('../../controlers/back-office/shedule')


router.route('/')
    .get(sheduleRoutes.getShedules)
    .post(sheduleRoutes.addShedule)
    .put(sheduleRoutes.updateShedule)
    .delete(sheduleRoutes.deletEntry)

router.route('/pontaj')
    .get(sheduleRoutes.getPontaj)
    .post(sheduleRoutes.addPontaj)
    .delete(sheduleRoutes.deletePontaj)


router.route('/position')
    .get(sheduleRoutes.getPositions)
    .post(sheduleRoutes.addPosition)
    .put(sheduleRoutes.editPosition)
    .delete(sheduleRoutes.deletePosition)



module.exports = router