const express = require('express');
const router = express.Router();
const messCtrl = require('../controlers/messages')


router.route('/send-msg').get(messCtrl.send)


module.exports = router