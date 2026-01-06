const express = require("express");
const router = express.Router();
const resControlers = require('../controlers/reservation.js')
const {authApi} = require('../auth/auth.js')

router.post('/', resControlers.addReservation);

router
  .route('/')
  .all(authApi) // applies only to GET, PUT, DELETE here
  .get(resControlers.getReservations)
  .put(resControlers.updateReservation)
  .delete(resControlers.deleteReservation);

router.route('/event')
    .all(authApi)
    .get(resControlers.getEvents)
    .post(resControlers.createEvent)
    .put(resControlers.editEvent)
    .delete(resControlers.deleteEvent)

router.route('/event-one').get(authApi, resControlers.getEventById)

router.route('/id', authApi).get(resControlers.getReservationById)
router.route('/update', authApi).post(resControlers.modifyReservationStatus)

router.route('/online').post(resControlers.addReservationFromClient)
router.route('/contact').post(resControlers.createContact)

router.route('/shedule')
        .get(resControlers.getReservationShedule)
        .post(resControlers.createReservationShedule)
        .put(resControlers.updateReservationSheduleSettings)
router.route('/sh-temp').get(resControlers.getTempReservationShedule)
router.route('/shedule-hours')
        .put(resControlers.updateSheduleHours)
router.route('/shedules')
    .get(resControlers.getReservationShedules)
router.route('/shedule-id').get(resControlers.getReservationSheduleById)

router.route('/encript-url').post(resControlers.encriptURLObject)



module.exports = router