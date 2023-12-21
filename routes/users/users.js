const express = require('express');
const router = express.Router();
const users = require('../../controlers/users/users')


router.route('/')
    .post(users.sendUsers)

router.route('/user')
    .post(users.sendUser)
    .put(users.editUser)

router.route('/ed-user')
    .delete(users.deleteUser)

router.route('/customer')
    .get(users.sendCustomer)
    .post(users.newCustomer)




module.exports = router  