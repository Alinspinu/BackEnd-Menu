const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controlers/notification')
const {authApi, authApiAdmin} = require('../auth/auth')


router.route('/').post(notificationCtrl.addNotification)

router.route('/')
    .all(authApi)
    .get(notificationCtrl.getNotifications)
    .put(notificationCtrl.updateNotification)

router.route('/sub').post(authApi, notificationCtrl.subscription)

router.route('/id').get(authApi, notificationCtrl.getNotificationById)



module.exports = router