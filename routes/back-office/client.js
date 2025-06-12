const express = require('express');
const router = express.Router();
const clients = require('../../controlers/back-office/client')



router.route('/')
    .post(clients.addClient)
    .get(clients.getClients)
    .put(clients.editClient)


module.exports = router