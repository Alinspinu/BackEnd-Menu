const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controlers/notification')


router.route('/new').post(notificationCtrl.new)
router.route('/get').get(notificationCtrl.getNotification)
router.route('/live').get(notificationCtrl.sendLiveNotifications)
router.route('/delete').delete(notificationCtrl.deleteNotification)
router.route('/update').put(notificationCtrl.updateNotification)



module.exports = router