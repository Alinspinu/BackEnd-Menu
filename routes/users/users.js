const express = require('express');
const router = express.Router();
const users = require('../../controlers/users/users')

const multer = require('multer');
const { storage } = require('../../cloudinary/photo-true.js');
const upload = multer({ storage });


router.route('/')
    .post(users.sendUsers)
    .get(users.sendEmployees)
    .put(users.editPosition)

router.route('/user')
    .post(users.sendUser)
    .put(users.editUser)

router.route('/disc').post(users.editUserDiscount)

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

router.route('/edit-list').put(users.modifySuplierSoldList)

router.route('/locatie')
    .put(users.editLocatieData)
    .post(users.addAnafToken)
    .get(users.getRefreshTokenValability)

router.route('/refresh').post(users.refreshToken)

router.route('/get-cash').get(users.sendUserCashback)

router.route('/work-log')
.put(users.updateWorkLog)
.post(users.deleteWorkEntry)
.delete(users.deletePaymentEntry)

router.route('/find').get(users.detectPaymentError)

router.route('/sale-point')
    .get(users.getSalePoints)
    .post(users.addSalePoint)
    .put(users.editSalePoint)
    .delete(users.deleteSalePoint)

router.route('/point').get(users.getSalePoint)

 

router.route('/server')
    .get(users.getServers)
    .post(users.savePrintServer)
    .put(users.editPrintServer)
    .delete(users.deletePrintServer)


module.exports = router  