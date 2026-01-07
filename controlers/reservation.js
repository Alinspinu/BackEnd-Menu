const Reservation = require('../models/office/reservation')
const {ReservationSchedule, ResMonth, ResDays, ResHour} = require('../models/office/reservation-shedule')
const User = require('../models/users/user')
const Notification = require('../models/users/notification')
const SalePoint = require('../models/utils/sale-point')
const Subscription = require('../models/utils/subscription')
const ContactMessage = require('../models/utils/contact-mes')
const Locatie = require('../models/office/locatie')
const Event = require('../models/office/event')


const {sendReservationEmail, sendAdminMessage, sendEmailSmtp} = require('../utils/mail')



const { io } = require('socket.io-client');
const socket = io("https://flowmanager.ro", {
  path: '/socket.io/',
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("Connected to external socket server:", socket.id);
});

const webPush = require('web-push');


const crypto = require('crypto');

const SECRET = "dir6Yk-iw0m8h-ojstp3-esjndy-ejnd"; 
const ALGO = "aes-256-ctr";


webPush.setVapidDetails(
    'mailto:alin@flowmanager.ro',
    process.env.WEB_PUSH_PUBLIC,
    process.env.WEB_PUSH_PRIVATE,
  );





module.exports.getEvents = async (req, res) => {
  const {loc, point} = req.query

  try{
    const events = await Event.find({locatie: loc, salePoint: point})
            .populate({path: 'reservations'})
            .populate({path: 'hours'})

    res.status(200).json(events)
  } catch(error){
    console.log(error)
    res.status(200).json(error)
  }
}


module.exports.createEvent = async (req, res) => {
  const {event} = req.body;

  try{

    const newEvent = new Event(event)

    const dataToEncript = JSON.stringify({eventId: newEvent._id})
    const encriptedData = encryptObject(dataToEncript)

    const url = `https://front.flowmanager.ro/event-reserve?data=${encriptedData}`

    newEvent.eventUrl = url
    await newEvent.populate('hours');
    const savedEvent = await newEvent.save()
    res.status(200).json({message: 'Evenimentul a fost creat cu success!', event: savedEvent})

  } catch(err) {
    console.log(err)
    res.status(500).json(err)
  }
}



module.exports.getEventById = async (req, res) => {
  const {id} = req.query
  try{

    const event = await Event.findById(id)
            .populate({path: 'hours'})
            .populate({path: 'reservations'})

    res.status(200).json(event)
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}



module.exports.editEvent = async (req, res) => {
  const {event} = req.body

 try{
  const editedEv = await Event.findByIdAndUpdate(event._id, event, {new: true})
            .populate({path: 'hours'})
            .populate({path: 'reservations'})
  res.status(200).json({message: 'Evenimentul a fost creat cu success!', event: editedEv})
 } catch(error){
  console.log(error)
  res.status(500).json(error)
 }

}




module.exports.deleteEvent = async (req, res) => {
  const {id} = req.query
  try{

    await Event.findByIdAndDelete(id)

    res.status(200).json({message: 'Evenimentul a fost șters cu success!'})
  } catch(error){
    console.log(error)
    res.status(500).josn(error)
  }
}




module.exports.getReservationShedule = async (req, res) => {
    const {loc, point, year} = req.query
    console.log('hittt')
    try{
       const y = new Date(year)
        const shedule = await ReservationSchedule.findOne({locatie: loc, salePoint: point, temp: true, 'year.date': y})
                    .populate({path: 'year.months', populate: {path: 'days', populate: {path: 'hours', populate: {path: 'reservations'}}}}).lean()

        

        const sh = await updateReservationShedule(shedule)
        console.log(sh.temp)
        res.status(200).json(sh)

    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getReservationShedules = async (req, res) => {
    const {loc, point} = req.query
    try{
        console.log('locatie ', loc, 'point ', point)
        const shedules = await ReservationSchedule.find({locatie: loc, salePoint: point})
        res.status(200).json(shedules)
    } catch(error){
        res.status(500).json(error)
        console.log(error)
    }
}



async function  updateReservationShedule(shedule){
      for(let m of shedule.year.months){
        for(let d of m.days){
          for(let h of d.hours){
            if(h.reservations.length){
              let total = 0
              for(let r of h.reservations){
                total += r.guests
                if(r.kids === 1){
                  total += 1
                } 
                if(r.kids > 1){
                  total += r.kids/2
                }
              }
              if(h.people !== total) {
                h.people = total
               const hh = await ResHour.findByIdAndUpdate(h._id, h, {new: true})
              }
            }
            
          }
        }
      }

   const sh = await ReservationSchedule.findById(shedule._id).populate({path: 'year.months', populate: {path: 'days', populate: {path: 'hours', populate: {path: 'reservations'}}}})
   return sh
}


module.exports.getReservationSheduleById = async (req, res) => {
    const {id} = req.query
    try{
        const shedule = await ReservationSchedule.findById(id)
                    .populate({path: 'year.months', populate: {path: 'days', populate: {path: 'hours', populate: {path: 'reservations'}}}}).lean()

        res.status(200).json(shedule)

    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.updateSheduleHours = async (req, res) => {
    const {hours, sheduleId} = req.body
    try{
        const updates = []
        for(let h of hours){
            updates.push(
                ResHour.findByIdAndUpdate(
                  h._id,
                  h,
                  { new: false }
                )
              );
        }
        Promise.all(updates)
        .then(() => {
            return  ReservationSchedule.findById(sheduleId).populate({path: 'year.months', populate: {path: 'days', populate: {path: 'hours', populate: {path: 'reservations'}}}}).lean()
        })
        .then(newShedule => {
        socket.emit('reservationShedule', JSON.stringify({id: newShedule._id, point: newShedule.salePoint}))
          res.status(200).json({
            shedule: newShedule,
            message: 'Programul a fost actualizat'
          });
        })
        .catch(error => {
          console.error(error);
          res.status(500).json(error);
        });

    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
} 



module.exports.updateReservationSheduleSettings = (req, res) => {
    const { shedule, day } = req.body;
  
    // collect all update promises
    const updates = [];
  
    shedule.year.months.forEach(m => {
      m.days.forEach(d => {
        d.hours.forEach(h => {
          const hh = day.hours.find(hr => hr.label === h.label);
          if (hh) {
            updates.push(
              ResHour.findByIdAndUpdate(
                h._id,
                {
                  visible: hh.visible,
                  avalableTables: hh.avalableTables,
                  seats: hh.seats
                },
                { new: false }
              )
            );
          }
        });
      });
    });
  
    // run all updates in parallel
    Promise.all(updates)
        .then(() => {
            return  ReservationSchedule.findById(shedule._id).populate({path: 'year.months', populate: {path: 'days', populate: {path: 'hours', populate: {path: 'reservations'}}}}).lean()
        })
      .then(newShedule => {
        socket.emit('reservationShedule', JSON.stringify({id: newShedule._id, point: newShedule.salePoint}))
        res.status(200).json({
          shedule: newShedule,
          message: 'Programul a fost actualizat'
        });
      })
      .catch(error => {
        console.error(error);
        res.status(500).json(error);
      });
  };


  module.exports.getTempReservationShedule = async (req, res) => {
    const {loc, point, year} = req.query
    try{
       const y = new Date(year)
        const shedule = await ReservationSchedule.findOne({locatie: loc, salePoint: point, temp: false, 'year.date': y})
                    .populate({path: 'year.months', populate: {path: 'days', populate: {path: 'hours', populate: {path: 'reservations'}}}}).lean()

        const sh = await updateReservationShedule(shedule)
        res.status(200).json(sh)

    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}



module.exports.createReservationShedule = async (req, res) => {
    const { point, loc, year } = req.body;
  
    try {
      // 1️⃣ Create main schedule
      const schedule = await ReservationSchedule.create({
        salePoint: point,
        locatie: loc,
        temp: true,
        year: {
          date: new Date(year, 0, 1),
          bookedTables: 0,
          people: 0,
          months: []
        }
      });
  
      const yearNumber = parseInt(year);
  
      // 2️⃣ CREATE MONTHS
      const monthIds = [];
  
      for (let month = 0; month < 12; month++) {
  
        const monthDoc = await ResMonth.create({
          salePoint: point,
          locatie: loc,
          shedule: schedule._id,
          date: new Date(yearNumber, month, 1),
          bookedTables: 0,
          people: 0,
          days: []
        });
  
        monthIds.push(monthDoc._id);
  
        const daysInMonth = new Date(yearNumber, month + 1, 0).getDate();
        const dayIds = [];
  
        // 3️⃣ CREATE DAYS
        for (let day = 1; day <= daysInMonth; day++) {
  
          const dayDoc = await ResDays.create({
            salePoint: point,
            locatie: loc,
            shedule: schedule._id,
            label: day,
            date: new Date(yearNumber, month, day),
            bookedTables: 0,
            people: 0,
            hours: []
          });
  
          dayIds.push(dayDoc._id);
  
          const hourIds = [];
  
          // 4️⃣ CREATE HOURS
          for (let slot = 0; slot < 48; slot++) {

            const hour = Math.floor(slot / 2);
            const minute = slot % 2 === 0 ? 0 : 30;
          
            const start = new Date(yearNumber, month, day, hour, minute);
            const end = new Date(yearNumber, month, day, hour, minute + 30);
          
            const format = (h, m) =>
              `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          
            const label = `${format(start.getHours(), start.getMinutes())} - ${format(
              end.getHours(),
              end.getMinutes()
            )}`;
          
            const hourDoc = await ResHour.create({
              salePoint: point,
              locatie: loc,
              shedule: schedule._id,
              label,
              availableTables: 0,
              bookedTables: 0,
              people: 0,
              full: false,
              visible: true,
              start,
              end,
              reservations: []
            });
          
            hourIds.push(hourDoc._id);
          }
  
          // attach hour IDs to day
          dayDoc.hours = hourIds;
          await dayDoc.save();
        }
  
        // attach day IDs to month
        monthDoc.days = dayIds;
        await monthDoc.save();
      }
  
      // 5️⃣ attach month IDs to schedule
      schedule.year.months = monthIds;
      const savedSchedule = await schedule.save();
  
      return res.status(200).json({
        shedule: savedSchedule,
        message: `Calendarul de rezervări pentru anul ${year} a fost creat!`
      });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error", error });
    }
  };






  module.exports.encriptURLObject = async (req, res) => {
    const {point, loc} = req.body
    try{
        const dataToEncript = JSON.stringify({point, loc})
        const encriptedData = encryptObject(dataToEncript)

        const url = `https://front.flowmanager.ro/reserve?data=${encriptedData}`
        res.status(200).json({url: url})
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
  }

  function encryptObject(obj) {
    const iv = crypto.randomBytes(16); // random IV for security
  
    const cipher = crypto.createCipheriv(
      ALGO,
      Buffer.from(SECRET),
      iv
    );
  
    const json = JSON.stringify(obj);
    const encrypted = Buffer.concat([cipher.update(json), cipher.final()]);
  
    // return "iv:encrypted" format
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }



  function encryptObject(obj) {
    const iv = crypto.randomBytes(16); // random IV for security
  
    const cipher = crypto.createCipheriv(
      ALGO,
      Buffer.from(SECRET),
      iv
    );
  
    const json = JSON.stringify(obj);
    const encrypted = Buffer.concat([cipher.update(json), cipher.final()]);
  
    // return "iv:encrypted" format
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  }
  


module.exports.addReservationFromClient = async(req, res)  => {
    const {reservation} = req.body
    try{
        const salePoint = await SalePoint.findById(reservation.salePoint)
        const userIds = salePoint.notifications.flatMap(u => {
            if (!u.reservation) return [];
            return [u.user];
          });

        const newReservation = new Reservation(reservation)
        const startTime = new Date(reservation.date).getTime() - 2 * 60 * 60 * 1000
        const endTime = new Date(reservation.date).getTime() + 2 * 60 * 60 * 1000
        const reservations = await Reservation.find({salePoint: reservation.salePoint, status: 'accepted', date: {$gte: startTime, $lte: endTime}})
        let pendding = ' '
        if(reservations.length > 4 || reservation.guests > 15){
            newReservation.status = 'pending' 
            pendding = ' în AȘTEPTARE '
        } else {
            newReservation.status = 'accepted'
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
                url: `https://front.flowmanager.ro/reservations/${savedReservation._id}`
                },
            },
            message: `Rezevare${pendding}la ${salePoint.name} pe ${savedReservation.dateString}, pentru ${savedReservation.client.name}, ${savedReservation.guests} persoane, ${savedReservation.details}!`
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
        await sendReservationEmail(updatedReservation)
        res.status(200).json(updatedReservation)
    } catch(error) {
        res.status(500).json(error)
        console.log(error)
    }

}


module.exports.getReservations = async(req, res) => {
    const {loc, date, point} = req.query
    const currentDate = new Date(date).getTime()
    try{
        const reservations = await Reservation.find(
            {
                locatie: loc, 
                salePoint: point, 
                date: {$gte: currentDate}
            }
        )
         .populate([{path: 'user', select: 'employee.fullName'}, {path: 'client.client'}, {path: 'salePoint'}]).lean()
        res.status(200).json(reservations)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.createCancelURLObject = async (req, res) => {
  const {point, loc, resId} = req.body
  try{
      const dataToEncript = JSON.stringify({point, loc, resId})
      const encriptedData = encryptObject(dataToEncript)

      const url = `https://front.flowmanager.ro/cancel?data=${encriptedData}`
      res.status(200).json({url: url})
  } catch(error){
      console.log(error)
      res.status(500).json(error)
  }
}

function createCancelUrl(resId){
  const dataToEncript = JSON.stringify({id: resId})
  const encriptedData = encryptObject(dataToEncript)

  const url = `https://front.flowmanager.ro/cancel?data=${encriptedData}`
  return url
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
        const ress = await Reservation.findById(savedReservation._id).populate({path: 'locatie'}).populate({path: 'salePoint'})
        console.log(ress.client.email)
        socket.emit('reservation', JSON.stringify(savedReservation))
        res.status(200).json(savedReservation)
        if(ress.client.email){
          await sendEmailSmtp(ress, createCancelUrl(ress._id.toString()))
        }
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
    const {update, id, hours} = req.body
    try{
        if(hours && id && update){
          let ppl = update.guests
          if(ppl > 5 && ppl < 9) ppl = 8
          let newkids = update.kids || 0
          if(newkids > 1) kids = newkids / 2
            const reservation = await Reservation.findById(id)
            let oldkids = reservation.kids || 0
            if(oldkids > 1) kids = oldkids / 2
            let oldppl = reservation.guests
            if(oldppl > 5 && oldppl < 9) ppl = 8

            const updatedReservation = await Reservation.findByIdAndUpdate(id, update, {new: true})
            await ResHour.updateMany({reservations: id}, {$pull: {reservations: id}, $inc: {people: - (oldppl + oldkids)}})
            await ResHour.updateMany({_id: { $in: hours.map(h => h._id) }}, {$push: {reservations: id}, $inc: {people: ppl + newkids}})
            socket.emit('reservationShedule', JSON.stringify({id: hours[0].shedule, point: hours[0].salePoint}))
            socket.emit('reservation', JSON.stringify(updatedReservation))
            res.status(200).json(updatedReservation)
        } else {
          console.log( 'ERROR Missing data')
            res.status(404).json({message: 'ERROR Missing data'})
        }
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}






module.exports.deleteReservation = async (req, res) => {
    const { id } = req.query;
  
    try {
      const reservation = await Reservation.findById(id).populate('resHour');
  
      if (!reservation) {
        return res.status(404).json({ message: 'Rezervarea nu a fost găsită!' });
      }
  
      let sheduleId;
      const updates = [];

      let kids = reservation.kids || 0

      let ppl = reservation.guests

      if(ppl > 5 && ppl <9) ppl = 8

      if(kids > 1){
        kids = kids / 2
      }

      console.log('oameni de zcazut ', ppl+kids)

      if(reservation.eventId?.length){
        updates.push(
          Event.findByIdAndUpdate(reservation.eventId, {$inc: {people: -(ppl+kids), $pull: {reservations: id}}})
        )
      }
  
      for (const h of reservation.resHour) {
        sheduleId = h.shedule;
  
        updates.push(
          ResHour.findByIdAndUpdate(
            h._id,
            { $inc: { people: -(ppl + kids) }, $set: { full: false } },
            { new: false }
          )
        );
      }
  
      return Promise.all(updates)
        .then(() => Reservation.findByIdAndDelete(id))
        .then(() => {
          return ReservationSchedule.findById(sheduleId)
        })
        .then(newShedule => {
          socket.emit('reservationShedule', JSON.stringify({id: newShedule._id, point: newShedule.salePoint}))
          res.status(200).json({
            message: 'Rezervarea a fost ștearsă cu succes și programul actualizat'
          });
        })
        .catch(error => {
          console.error(error);
          res.status(500).json({ message: 'Server error', error });
        });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error', error });
    }
  };



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
        await webPush.sendNotification(sub.subscription, payload);
      } catch (error) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          await Subscription.deleteOne({ _id: sub._id });
        } else {
          console.error('Failed to send notification:', error);
        }
      }
    }
}


module.exports.createContact = async (req, res) => {
    const {message, adminEmail='office@truefinecoffee.ro'} = req.body
    try{
        const newMessage = new ContactMessage(message)
        const savedMessage = await newMessage.save()
        const locatie = await Locatie.findById(message.locatie)
        const data = { mess: savedMessage, locatie: locatie}
        await sendAdminMessage(data, adminEmail)
        res.status(200).json({message: 'All good'})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

