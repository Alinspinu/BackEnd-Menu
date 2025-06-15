const express = require('express');
const router = express.Router();
const clients = require('../../controlers/back-office/client')



router.route('/')
    .post(clients.addClient)
    .get(clients.getClients)
    .put(clients.editClient)

router.route('/get-one')
    .get(clients.getClient)

router.route('/add-record')
    .post(clients.addRecord)

router.route('/remove-record')
    .put(clients.removeRecord)

module.exports = router