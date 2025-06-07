const express = require('express');
const router = express.Router();
const clients = require('../../controlers/back-office/client')



router.route('/')
    .post(clients.addClient)
    .get(clients.getClients)


module.exports = router