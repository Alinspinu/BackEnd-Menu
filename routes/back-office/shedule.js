const express = require('express');
const router = express.Router();
const sheduleRoutes = require('../../controlers/back-office/shedule')


router.route('/')
    .get(sheduleRoutes.getShedules)
    .post(sheduleRoutes.addShedule)
    .put(sheduleRoutes.updateShedule)
    .delete(sheduleRoutes.deletEntry)

router.route('/d').delete(sheduleRoutes.deleteShedule)

router.route('/pontaj')
    .get(sheduleRoutes.getPontaj)
    .post(sheduleRoutes.addPontaj)
    .delete(sheduleRoutes.deletePontaj)


router.route('/position')
    .get(sheduleRoutes.getPositions)
    .post(sheduleRoutes.addPosition)
    .put(sheduleRoutes.editPosition)
    .delete(sheduleRoutes.deletePosition)

router.route('/position-all').post(sheduleRoutes.updateAllPositions)
router.route('/partial').post(sheduleRoutes.updatePartialShedule)
router.route('/print-users-sheet').post(sheduleRoutes.createUsersSheet)




module.exports = router