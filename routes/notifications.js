const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controlers/notification')


router.route('/')
    .get(notificationCtrl.getNotifications)
    .post(notificationCtrl.addNotification)
    .put(notificationCtrl.updateNotification)



module.exports = router