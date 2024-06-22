const express = require('express');
const router = express.Router();
const users = require('../../controlers/users/users')

const multer = require('multer');
const { storage } = require('../../cloudinary/photo-true.js');
const upload = multer({ storage });


router.route('/')
    .post(users.sendUsers)

router.route('/user')
    .post(users.sendUser)
    .put(users.editUser)

router.route('/front-user').put(upload.single('image'), users.updateUser)

router.route('/ed-user')
    .delete(users.deleteUser)

router.route('/customer')
    .get(users.sendCustomer)
    .post(users.newCustomer)

router.route('/generateQr')
    .get(users.generateUserQrCode)

router.route('/loc')
    .get(users.sendLocatie)
    .put(users.editLocatie)
    .post(users.updateVivaData)


router.route('/get-cash').get(users.sendUserCashback)

router.route('/work-log')
.put(users.updateWorkLog)
.post(users.deleteWorkEntry)

router.route('/find').get(users.detectPaymentError)


module.exports = router  