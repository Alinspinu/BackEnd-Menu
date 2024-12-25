const Reservation = require('../models/office/reservation')
const User = require('../models/users/user')


const io = require('socket.io-client')
const socket = io("https://socket.flowmanager.ro")


module.exports.getReservations = async(req, res) => {
    const {loc, date} = req.query
    const currentDate = new Date(date)
    try{
        const reservations = await Reservation.find({locatie: loc, date: {$gte: currentDate}}).limit(20).populate([{path: 'user', select: 'employee.fullName'}, {path: 'client.client'}])
        res.status(200).json(reservations)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.addReservation = async(req, res)  => {
    const {reservation} = req.body
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

