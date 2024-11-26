const Notification = require('../models/users/notification');


const io = require('socket.io-client')
const socket = io("https://live669-0bac3349fa62.herokuapp.com")

module.exports.addNotification = async(req, res) => {
    const {notification} = req.body
    console.log(notification)
    try{
        const newNot = new Notification(notification)
        const savedNot = await newNot.save()
        console.log(savedNot)
        socket.emit('notification', JSON.stringify(savedNot))
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