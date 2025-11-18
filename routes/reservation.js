const express = require("express");
const router = express.Router();
const resControlers = require('../controlers/reservation.js')
const {authApi} = require('../auth/auth.js')

router.route('/', authApi)
    .get(resControlers.getReservations)
    .post(resControlers.addReservation)
    .put(resControlers.updateReservation)
    .delete(resControlers.deleteReservation)

router.route('/id', authApi).get(resControlers.getReservationById)
router.route('/update', authApi).post(resControlers.modifyReservationStatus)

router.route('/online').post(resControlers.addReservationFromClient)
router.route('/contact').post(resControlers.createContact)

router.route('/add-shedule').post(resControlers.createReservationShedule)



module.exports = router