const Reservation = require('../models/office/reservation')
const User = require('../models/users/user')
const Notification = require('../models/users/notification')
const SalePoint = require('../models/utils/sale-point')
const Subscription = require('../models/utils/subscription')

const {sendReservationEmail} = require('../utils/mail')



const io = require('socket.io-client')
const socket = io("https://socket.flowmanager.ro")

const webPush = require('web-push');
const locatie = require('../models/office/locatie')


webPush.setVapidDetails(
    'mailto:alin@flowmanager.ro',
    process.env.WEB_PUSH_PUBLIC,
    process.env.WEB_PUSH_PRIVATE,
  );


module.exports.addReservationFromClient = async(req, res)  => {
    const {reservation} = req.body
    try{
        const userIds = (await User.find({'employee.active': true, 'checkIn.value': true }).select('_id')).map(u => u._id)
        const salePoint = await SalePoint.findById(reservation.salePoint)
        const newReservation = new Reservation(reservation)
        const startTime = new Date(reservation.date).getTime() - 2 * 60 * 60 * 1000
        const endTime = new Date(reservation.date).getTime() + 2 * 60 * 60 * 1000
        const reservations = Reservation.find({salePoint: reservation.salePoint, date: {$lte: endTime, $gte: startTime}})
        let pendding = ' '
        if(reservations.length > 6){
            newReservation.status = 'pending' 
            pendding = ' în AȘTEPTARE '
        } 
        const savedReservation = await newReservation.save()
        socket.emit('reservation', JSON.stringify(savedReservation))
        const notif = new Notification({
            sender: 'Rezervare Online',
            user: '64ac67f274937927c7aa9c05',
            reciver: userIds,
            locatie: savedReservation.locatie,
            status: [],
            redirectLink: '',
            type: {
                name: 'Rezervare Online',
                data: {
                url: `https://cash-flow-waiters.web.app/reservation/${savedReservation._id}`
                },
            },
            message: `Rezevare${pendding}la ${salePoint.name} pe ${savedReservation.dateString}, prntru ${savedReservation.client.name}, ${savedReservation.guests} persoane, ${savedReservation.details}!`
        }) 
        const savedNot = await notif.save()
        socket.emit('notification', JSON.stringify(savedNot))
        await sendPushNotifications(savedNot, userIds)
        res.status(200).json(savedReservation)
        
    } catch(error){
        console.log(error)
        res.status(200).json(error)
    }
}


module.exports.modifyReservationStatus = async(req, res) => {
    const {reservation} = req.body
    try{
        const updatedReservation = await Reservation.findByIdAndUpdate(reservation._id, reservation, {new: true}).populate({path: 'locatie'}).populate({path: 'salePoint'})
        await sendReservationEmail(reservation)
        res.status(200).json(updatedReservation)
    } catch(error) {
        res.status(500).json(error)
        console.log(error)
    }

}


module.exports.getReservations = async(req, res) => {
    const {loc, date, point} = req.query
    const currentDate = new Date(date)
    try{
        const reservations = await Reservation.find(
            {
                locatie: loc, 
                salePoint: point, 
                date: {$gte: currentDate}
            }
        ).limit(20)
         .populate([{path: 'user', select: 'employee.fullName'}, {path: 'client.client'}, {path: 'salePoint'}])
        res.status(200).json(reservations)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.addReservation = async(req, res)  => {
    const {reservation, email} = req.body
    try{
        const client = await User.findOne({telephone: reservation.client.telephone})
        if(client){
            reservation.client.client = client._id
        }
        const newReservation = new Reservation(reservation)
        const savedReservation = await newReservation.save()
        socket.emit('reservation', JSON.stringify(savedReservation))
        res.status(200).json(savedReservation)
    } catch(error){
        console.log(error)
        res.status(200).json(error)
    }
}

module.exports.getReservationById = async(req, res) => {
    const {id} = req.query
    try{
        const reservation = await Reservation.findById(id)
        res.status(200).json(reservation)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.updateReservation = async(req, res) => {
    const {update, id} = req.body
    try{
        const updatedReservation = await Reservation.findByIdAndUpdate(id, update, {new: true}).populate([{path: 'user', select: 'employee.fullName'}, {path: 'client.client'}])
        socket.emit('reservation', JSON.stringify(updatedReservation))
        res.status(200).json(updatedReservation)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.deleteReservation = async(req, res) => {
    const {id} = req.query;
    try{
        await Reservation.findByIdAndDelete(id)
        res.status(200).json({message: 'success'})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}



async function sendPushNotifications(notification, userIds){
    const pushNotificationPayload = {
        notification: {
          title: notification.type.name,
          body: notification.message,
          icon: "/assets/icon/coffee.svg",
          badge: "/assets/icon/coffee.svg",
          image: "/assets/icon/coffee.svg",
          data: {
            url: notification.type.data.url,
          },
          requireInteraction: true,
          silent: false
        }
      };
    const payload = JSON.stringify(pushNotificationPayload)
    const subscriptions = await Subscription.find({ userId: { $in: userIds } });

    for (const sub of subscriptions) {
      try {
        await webPush.sendNotification(sub.subscription, JSON.stringify(payload));
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await Subscription.deleteOne({ _id: sub._id });
        } else {
          console.error('Failed to send notification:', error);
        }
      }
    }
}

