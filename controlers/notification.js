const Notification = require('../models/users/notification')
const { default: mongoose } = require('mongoose')



module.exports.new = async (req, res, next) => {
    try{
        const {notification} = req.body
        const dbNot = await Notification.findOne({eventId: notification.eventId, event: notification.event})
        if(!dbNot){
            const newNotification = new Notification(notification)
            await newNotification.save()
            res.status(200).json({message: 'new'})
        } else {
            console.log('hit not new')
            dbNot.status = "new"
            const id = new mongoose.Types.ObjectId(notification.sender)
            dbNot.sender.push(id)
            if(dbNot.sender.length === 2){
                const wordsArr = dbNot.message.split(' ');
                wordsArr[0] = 'au'
                wordsArr.splice(0, 0, 'și', 'alții')
                const message = wordsArr.join(' ') 
                dbNot.message = message
            }
            await dbNot.save()
            res.status(200).json({message: "Not new"})
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.updateNotification = async (req, res, next) => {
    try{
        const {notification} = req.body
        const notf =  await Notification.findByIdAndUpdate(notification._id, notification, {new: true})
        res.status(200).json({message: 'Notification updated'})
    } catch (err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.deleteNotification = async (req, res, next) => {
    try{
        const {eventId, event} = req.query
        console.log(req.query)
       const notif =  await Notification.findOne({eventId: eventId, event: event})
       if(notif){
           await notif.deleteOne()
           res.status(200).json({message: "Notificarea a fost stearsa!"})
       } else{
           res.status(200).json({message: 'Notificarea nu a fost găsită!'})
       }
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.getNotification = async (req, res, next) => {
    try{
        const {userId} = req.query
        const notifications = await Notification.find({reciver: userId}).populate({path: 'sender', select: 'name profilePic'})
        res.status(200).json(notifications)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.sendLiveNotifications = async (req, res, next) => {
    try{
        const {userId} = req.query
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        const changeStream = Notification.watch({ fullDocument: "updateLookup" });
        changeStream.on("change", async (change) => {
            if (
                (change.operationType === "insert") &&
                change.fullDocument.status === 'new' &&
                change.fullDocument.reciver === userId
            ) {
                const notification = await Notification.findOne({ _id: change.fullDocument._id }).populate({path: 'sender', model: 'User', select: "name" });
                res.write(`data: ${JSON.stringify(notification)}\n\n`);
            }
        })
        console.log('hit the message')
        const message = { message: 'No Orders' }
    } catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

















