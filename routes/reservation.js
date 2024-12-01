const express = require("express");
const router = express.Router();
const resControlers = require('../controlers/reservation.js')

router.route('/')
    .get(resControlers.getReservations)
    .post(resControlers.addReservation)
    .put(resControlers.updateReservation)
    .delete(resControlers.deleteReservation)

router.route('/id').get(resControlers.getReservationById)


module.exports = router