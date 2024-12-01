const Notification = require('../models/users/notification');
const Subscription = require('../models/utils/subscription')
const User = require('../models/users/user')
const Reservation = require('../models/office/reservation')
const {formatedDateToShow, getNowShedule} = require('../utils/functions')
const Shedule = require('../models/users/shedule')

const webPush = require('web-push');

const io = require('socket.io-client');
const socket = io("https://live669-0bac3349fa62.herokuapp.com")


webPush.setVapidDetails(
    'mailto:alin@flowmanager.ro',
    process.env.WEB_PUSH_PUBLIC,
    process.env.WEB_PUSH_PRIVATE,
  );

module.exports.addNotification = async(req, res) => {
    const {notification, userId} = req.body
    try{
        const newNot = new Notification(notification)
        const savedNot = await newNot.save()
        socket.emit('notification', JSON.stringify(savedNot))
        let userIds = []
        if(userId === 'all'){
            userIds = (await User.find({'employee.active': true, 'checkIn.value': true }).select('_id')).map(u => u._id)
        } else {
            userIds = userId
        }
        await sendPushNotifications(savedNot, userIds)
        res.status(200).json(savedNot)  
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.updateNotification = async(req, res) => {
    const {notiIDs, userId} = req.body
    try{
        const response = await Notification.updateMany({ _id: { $in: notiIDs } }, { $push: { status: userId } })
        const notifications = await Notification.find({_id: { $in: notiIDs } })
        res.status(200).json(notifications)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getNotifications = async(req, res) => {
    const {loc, id} = req.query
    try{
        const notifications = await Notification.find({locatie: loc, reciver: id})    
            .sort({ createdAt: -1 })
            .limit(30)
        res.status(200).json(notifications)
    } catch(error){
        console.log(error)
        res.status(200).json(error)
    }
}

module.exports.getNotificationById = async(req, res) => {
  const {id} = req.query
  try{
    const notification = await Notification.findById(id)
    res.status(200).json(notification)
  }catch(error){
    res.status(500).json(error)
  }
}



module.exports.subscription = async (req, res) => {
    const { userId, subscription } = req.body;
   try {
    const existingSubscription = await Subscription.findOne({
      userId,
      'subscription.endpoint': subscription.endpoint, // Match by unique endpoint
    });

    if (!existingSubscription) {
      const newSubscription = new Subscription({ userId, subscription });
      await newSubscription.save();
      return res.status(201).json({ message: 'Subscription saved.' });
    }

    res.status(200).json({ message: 'Subscription already exists.' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription.' });
  }
}





module.exports.checkAndNotifyReservations = async () => {
    try {
     const now = new Date()
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      const reservations = await Reservation.find({
        date: { $gte: now, $lte: oneHourLater },
        notified: false,
      });
  
      if (reservations.length > 0) {
        const  userIds = (await User.find({'employee.active': true, 'checkIn.value': true }).select('_id')).map(u => u._id)
        const notificationPromises = reservations.map(async (reservation) => {
            const notif = {
              sender: 'Admin',
              user: '64fdd7da9df46ea2df9cf8c8',
              reciver: '',
              locatie: reservation.locatie,
              status: [],
              redirectLink: '',
              type: {
                name: 'Reamintire',
                data: {
                  url: 'https://cash-flow-waiters.web.app/reservations'
                },
              },
              message: `Avem o rezevare ${formatedDateToShow(reservation.date, +2)}, ${reservation.client.name}, ${reservation.guests} persoane, ${reservation.position}!`
            };
            try {
                const newNot = new Notification(notif);
                const savedNot = await newNot.save(); 
                await sendPushNotifications(savedNot, userIds); 
              } catch (err) {
                console.error('Error sending notification for reservation:', reservation._id, err);
              }
          });

        await Promise.all(notificationPromises)
        const reservationIds = reservations.map(reservation => reservation._id);
        await Reservation.updateMany(
          { _id: { $in: reservationIds } },
          { $set: { notified: true } }      
        );

      } else {
        console.log('No reservations to notify.');
      }
    } catch (err) {
      console.error('Error checking reservations:', err); 
    }
  }


module.exports.sendGreating = async () => {
    try{
      const shedules = await Shedule.find({locatie: '655e2e7c5a3d53943c6b7c53' })
          .sort({_id: -1})
          .limit(3)
      const shedule = getNowShedule(shedules)
      console.log(shedule.days[6].users[3])
      console.log(new Date(shedule.days[6].users[2].workPeriod.start).toLocaleString())
    } catch(error){
      console.log(error)
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
            url: notification.type.name === "Rezervare" ? notification.type.data.url : `${notification.type.data.url}/${notification._id}`,
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

