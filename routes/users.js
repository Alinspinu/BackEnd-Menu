const express = require('express');
const router = express.Router();
const users = require('../controlers/users')


router.route('/')
    .post(users.sendUsers)

router.route('/user')
    .post(users.sendUser)




module.exports = router  