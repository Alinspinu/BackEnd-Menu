const Notification = require('../models/users/notification');
const Locatie = require('../models/office/locatie')


const io = require('socket.io-client');
const { sendInfoAdminEmail } = require('../utils/mail');
const socket = io("https://live669-0bac3349fa62.herokuapp.com")

module.exports.addNotification = async(req, res) => {
    const {notification} = req.body
    try{
        const newNot = new Notification(notification)
        const savedNot = await newNot.save()
        socket.emit('notification', JSON.stringify(savedNot))
        if(savedNot.type.name === 'invoire' || savedNot.type.name === 'rezervare'){
            const loc = await Locatie.findById(savedNot.locatie)
            const data = {name: savedNot.sender, action: savedNot.message}
            const adminEmail = 'alinz.spinu@gmail.com'
            await sendInfoAdminEmail(data, adminEmail, loc.gmail)
        }
        res.status(200).json(savedNot)  
    } catch(error){ 
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.updateNotification = async(req, res) => {
    const {notiID, userId} = req.body
    try{
        const notification = await Notification.findByIdAndUpdate(notiID, {$push: {status: userId}}, {new: true})
        res.status(200).json(notification)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getNotifications = async(req, res) => {
    const {loc} = req.query
    try{
        const notifications = await Notification.find({locatie: loc})    
            .sort({ createdAt: -1 })
            .limit(30)
        res.status(200).json(notifications)
    } catch(error){
        console.log(error)
        res.status(200).json(error)
    }
}