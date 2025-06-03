
const Shedule = require('../../models/users/shedule')
const Pontaj = require('../../models/users/pontaj')
const User = require('../../models/users/user')
const mongoose = require('mongoose');
const {getNowShedule} = require('../../utils/functions');
const salePoint = require('../../models/utils/sale-point');



module.exports.addShedule = async (req, res, next) => {
    const {loc, salePoint} = req.body
    try{   
        const lastShedule = await Shedule.findOne({locatie: loc, salePoint: salePoint}, {}, { sort: { '_id': -1 } })
        const date = new Date(lastShedule.days[6].date)
        
        let days = []
        const weekdays = ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata'];
        for(let i = 1; i<=7; i++){
           const newDate = new Date(date.setDate(date.getDate() + 1)).setUTCHours(0,0,0,0);
           const dat = new Date(newDate);
           const weekdayNumber = dat.getDay();
           const day = {
                date: newDate,
                day: weekdays[weekdayNumber],
                users: [],
                workValue: 0,
           }
            days.push(day)
        }
        const startDate = new Date(days[0].date);
        const endDate = new Date(days[days.length -1].date);
        const options = {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "UTC"
        };
        
        const start = startDate.toLocaleString("ro-RO", options);
        const end = endDate.toLocaleString("ro-RO", options);
        const shedule = new Shedule({
                days: days,
                period: `${start} - ${end}`,
                locatie: loc,
                salePoint: salePoint
        })  
        const savedShedule = await shedule.save()
        res.status(200).json(savedShedule)

    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }


module.exports.addPontaj = async (req, res, next) => {
    const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
    const {loc, year, month, salePoint} = req.body

    try{

        const daysInMonth = getDaysInMonth(year, month);
        const days = []
        for(let i = 1; i<=daysInMonth; i++){
            const date = new Date(year, month, i)
            date.setUTCHours(0,0,0,0)
            const dates = new Date(date)
            const newDate = new Date(dates.setDate(dates.getDate())).setUTCHours(0,0,0,0);
            const day = {
                 date: newDate,
                 number: i,
                 users: [],
                 workValue: 0,
            }
             days.push(day)
         }
    
         const pontaj = new Pontaj({
            days: days,
            month: `${months[month]} - ${year}`,
            workValue: 0,
            locatie: loc,
            salePoint: salePoint
         })
         const newPontaj = await pontaj.save()
         res.status(200).json(newPontaj)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.getPontaj = async (req, res, next) => {
    const {loc, pont, month, point} = req.query
    try{    
        if(pont === 'last'){
            const pontajs = await Pontaj.find({locatie: loc, salePoint: point})
                .sort({_id: -1})
                .limit(3)
            const pontaj = getNowShedule(pontajs)    
            res.status(200).json(pontaj)
        }
        if(pont === 'all'){
            console.log('hit', loc, point)
            const ponts = await Pontaj.find({locatie: loc, salePoint: point})
            console.log(ponts)
            res.status(200).json(ponts)
        }
        if(month){
            const pont = await Pontaj.findOne({locatie: loc, month: month, salePoint: point})
            res.status(200).json(pont)
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}



module.exports.getShedules = async (req, res, next) => {
    const {loc, shedule, point} = req.query
    try{
        if(shedule === 'last'){
            const shedules = await Shedule.find({locatie: loc, salePoint: point})
            .sort({_id: -1})
            .limit(3)
            .populate({path: 'days.users.employee', select: 'employee.fullName'})
            const shedule = getNowShedule(shedules)
            res.status(200).json(shedule)
        }
        if(shedule === 'all'){
            const shedules = await Shedule.find({locatie: loc, salePoint: point}).populate({path: 'days.users.employee', select: 'employee.fullName'})
            res.status(200).json(shedules)
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.error.message})
    }
}

module.exports.updateShedule = async (req, res, next) => {
    const {sheduleId, day, user, month, dayValue, loc, point} = req.body
    try{
        const pontaj = await Pontaj.findOne({month: month, locatie: loc, salePoint: point})
        const shedule = await Shedule.findById(sheduleId).populate({path: 'days.users.employee', select: 'employee.fullName'})
        const us = await User.findById(user.employee).select('employee').populate({path: 'employee',select: 'position' })
        const dayIndex = shedule.days.findIndex(obj => obj.day === day.day)
        const pontDayIndex = pontaj.days.findIndex(obj => {
            const objDay = new Date(obj.date);
            const inputDay = new Date(day.date);
            objDay.setHours(0, 0, 0, 0);
            inputDay.setHours(0, 0, 0, 0);
            return objDay.getTime() === inputDay.getTime();
        })
        console.log('index ' ,pontDayIndex)
        const dayPontUserIndex = pontaj.days[pontDayIndex].users.findIndex(obj => obj.employee.toString() === user.employee)
        if(dayPontUserIndex !== -1){
            pontaj.days[pontDayIndex].users[dayPontUserIndex].hours = user.workPeriod.hours
            pontaj.days[pontDayIndex].users[dayPontUserIndex].value = dayValue
            pontaj.days[pontDayIndex].users[dayPontUserIndex].position = us.employee.position
            pontaj.days[pontDayIndex].users[dayPontUserIndex].concediu = user.workPeriod.concediu
            pontaj.days[pontDayIndex].users[dayPontUserIndex].medical = user.workPeriod.medical
            await pontaj.save()
        } else {
            const userToPush = {
                hours: user.workPeriod.hours,
                value: dayValue,
                employee: user.employee,
                position: us.employee.position,
                concediu: user.concediu,
                medical: user.medical,
            }
            const newPontaj =  await Pontaj.findOneAndUpdate({month: month, locatie: loc}, {$push: {[`days.${pontDayIndex}.users`]: userToPush}}, {new: true})
        }

        const dayUserIndex = shedule.days[dayIndex].users.findIndex(obj => obj.employee._id.toString() === user.employee);
        if(dayUserIndex !== -1){
           shedule.days[dayIndex].users[dayUserIndex].workPeriod = user.workPeriod
           shedule.days[dayIndex].users[dayUserIndex].checkIn = user.checkIn
            const savedShedule =  await shedule.save() 
             const newShedule = await Shedule.findById(savedShedule._id).populate({path: 'days.users.employee', select: 'employee.fullName'})
           res.status(200).json(newShedule)
        } else {
          const newShedule = await Shedule.findOneAndUpdate({_id: sheduleId}, {$push: {[`days.${dayIndex}.users`]: user}}, {new: true}).populate({path: 'days.users.employee', select: 'employee.fullName'})
          res.status(200).json(newShedule)
        }  
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.deletEntry = async (req, res, next) => {
    const {sheduleId, userId, day, month, dateStr, loc, point} = req.query
    try{
        const pontaj = await Pontaj.findOne({month: month, locatie: loc, salePoint: point})
        const shedule = await Shedule.findById(sheduleId)
        const date = new Date(dateStr)
        const pontDayIndex = pontaj.days.findIndex(obj => {
            const objDay = new Date(obj.date);
            const inputDay = new Date(date);
            objDay.setHours(0, 0, 0, 0);
            inputDay.setHours(0, 0, 0, 0);
            return objDay.getTime() === inputDay.getTime();
        })
        const newPontaj = await Pontaj.findOneAndUpdate(
            {month: month, locatie: loc, salePoint: point}, 
            {$pull: {[`days.${pontDayIndex}.users`]: {employee: userId}}}, 
            {new: true})
        const dayIndex = shedule.days.findIndex(obj => obj.day === day)
        const newShedule = await Shedule.findOneAndUpdate(
            {_id: sheduleId}, 
            {$pull: {[`days.${dayIndex}.users`]: {employee: userId}}}, 
            {new: true}).populate({path: 'days.users.employee', select: 'employee.fullName'})
         
        res.status(200).json(newShedule)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.deletePontaj = async (req, res, next) => {
    const {id} = req.query
    try{
        await Pontaj.findByIdAndDelete(id)
        res.status(200).json({message: 'Pontajul a fost sters'})
    }catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

