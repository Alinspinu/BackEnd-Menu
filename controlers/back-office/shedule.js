
const Shedule = require('../../models/users/shedule')
const Pontaj = require('../../models/users/pontaj')
const User = require('../../models/users/user')
const mongoose = require('mongoose');



module.exports.addShedule = async (req, res, next) => {
    const {loc} = req.body
    try{   
        // const date = new Date('Apr 29, 2024')
        const lastShedule = await Shedule.findOne({}, {}, { sort: { '_id': -1 } })
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
                locatie: loc
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
    const {loc, year, month} = req.body
    console.log(month)
    try{

        const daysInMonth = getDaysInMonth(year, month);
        const days = []
        for(let i = 1; i<=daysInMonth; i++){
            const date = new Date(year, month, i);
            const newDate = new Date(date.setDate(date.getDate()+1)).setUTCHours(0,0,0,0);
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
            locatie: loc
         })
         const newPontaj = await pontaj.save()
         res.status(200).json(newPontaj)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.getPontaj = async (req, res, next) => {
    const {loc, pont, month} = req.query
    try{    
        if(pont === 'last'){
            const pontaj = await Pontaj.findOne({locatie: loc}, {}, { sort: { '_id': -1 } })
            res.status(200).json(pontaj)
        }
        if(pont === 'all'){
            const ponts = await Pontaj.find({locatie: loc})
            res.status(200).json(ponts)
        }
        if(month){
            console.log(month)
            const pont = await Pontaj.findOne({locatie: loc, month: month})
            res.status(200).json(pont)
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}



module.exports.getShedules = async (req, res, next) => {
    const {loc, shedule} = req.query
    try{
        if(shedule === 'last'){
            const shedule = await Shedule.findOne({locatie: loc}, {}, { sort: { '_id': -1 } })
            res.status(200).json(shedule)
        }
        if(shedule === 'all'){
            const shedules = await Shedule.find({locatie: loc})
            res.status(200).json(shedules)
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.error.message})
    }
}

module.exports.updateShedule = async (req, res, next) => {
    const {sheduleId, day, user, month, dayValue} = req.body
    try{
        const pontaj = await Pontaj.findOne({month: month})
        const shedule = await Shedule.findById(sheduleId)
        const us = await User.findById(user.employee).select('employee').populate({path: 'employee',select: 'position' })
        const dayIndex = shedule.days.findIndex(obj => obj.day === day.day)
        const pontDayIndex = pontaj.days.findIndex(obj => {
            const objDay = new Date(obj.date);
            const inputDay = new Date(day.date);
            objDay.setHours(0, 0, 0, 0);
            inputDay.setHours(0, 0, 0, 0);
            return objDay.getTime() === inputDay.getTime();
        })
        const dayPontUserIndex = pontaj.days[pontDayIndex].users.findIndex(obj => obj.employee.toString() === user.employee)
        if(dayPontUserIndex !== -1){
            pontaj.days[pontDayIndex].users[dayPontUserIndex].hours = user.workPeriod.hours
            pontaj.days[pontDayIndex].users[dayPontUserIndex].value = dayValue
            pontaj.days[pontDayIndex].users[dayPontUserIndex].position = us.employee.position
            await pontaj.save()
        } else {
            const userToPush = {
                hours: user.workPeriod.hours,
                value: dayValue,
                employee: user.employee,
                position: us.employee.position
            }
            const newPontaj =  await Pontaj.findOneAndUpdate({month: month}, {$push: {[`days.${pontDayIndex}.users`]: userToPush}}, {new: true})
            console.log(newPontaj.days[pontDayIndex].users)
        }

        const dayUserIndex = shedule.days[dayIndex].users.findIndex(obj => obj.employee.toString() === user.employee)
        if(dayUserIndex !== -1){
           shedule.days[dayIndex].users[dayUserIndex].workPeriod = user.workPeriod
            const newShedule = await shedule.save() 
           res.status(200).json(newShedule)
        } else {
          const newShedule = await Shedule.findOneAndUpdate({_id: sheduleId}, {$push: {[`days.${dayIndex}.users`]: user}}, {new: true})
          res.status(200).json(newShedule)
        }  
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.deletEntry = async (req, res, next) => {
    const {sheduleId, userId, day, month, dateStr} = req.query
    console.log(month, dateStr)
    try{
        const pontaj = await Pontaj.findOne({month: month})
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
            {month: month}, 
            {$pull: {[`days.${pontDayIndex}.users`]: {employee: userId}}}, 
            {new: true})
        console.log(newPontaj.days[pontDayIndex])
        const dayIndex = shedule.days.findIndex(obj => obj.day === day)
        const newShedule = await Shedule.findOneAndUpdate(
            {_id: sheduleId}, 
            {$pull: {[`days.${dayIndex}.users`]: {employee: userId}}}, 
            {new: true})
            console.log(newShedule.days[dayIndex])
        res.status(200).json(newShedule)
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}