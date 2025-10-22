
const Shedule = require('../../models/users/shedule')
const Pontaj = require('../../models/users/pontaj')
const User = require('../../models/users/user')
const mongoose = require('mongoose');
const {getNowShedule} = require('../../utils/functions');
const salePoint = require('../../models/utils/sale-point');
const EmployeePosition = require('../../models/users/position')




module.exports.addShedule = async (req, res, next) => {
    const { loc, salePoint } = req.body;
  
    try {
      const lastShedule = await Shedule.findOne(
        { locatie: loc, salePoint: salePoint },
        {},
        { sort: { _id: -1 } }
      );
      const weekdays = ['Duminica', 'Luni', 'Marti', 'Miercuri', 'Joi', 'Vineri', 'Sambata'];
  
      let baseDate;
  
      if (lastShedule) {
        baseDate = new Date(lastShedule.days[6].date);
        baseDate.setDate(baseDate.getDate() + 1);
        baseDate.setUTCHours(0, 0, 0, 0);
      } else {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const dayOfWeek = today.getUTCDay(); 
        const daysSinceMonday = (dayOfWeek + 6) % 7;
        baseDate = new Date(today);
        baseDate.setDate(today.getDate() - daysSinceMonday); 
      }
  
      let days = [];
  
      for (let i = 0; i < 7; i++) {
        const date = new Date(baseDate);
        date.setDate(baseDate.getDate() + i);
  
        days.push({
          date: date.setUTCHours(0, 0, 0, 0),
          day: weekdays[date.getUTCDay()],
          users: [],
          workValue: 0
        });
      }
  
      const startDate = new Date(days[0].date);
      const endDate = new Date(days[6].date);
  
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      };
  
      const period = `${startDate.toLocaleString('ro-RO', options)} - ${endDate.toLocaleString('ro-RO', options)}`;

      const basicPeriods = [
        {
          label: 'LiBER',
          hourStart: '',
          hourEnd: '',
          period: 0,
          order: 1
        },
        {
          label: 'Concediu',
          hourStart: '8:00',
          hourEnd: '16:00',
          period: 8,
          order: 2
        },
        {
          label: 'Medical',
          hourStart: '8:00',
          hourEnd: '16:00',
          period: 8,
          order: 3
        }
      ]
  
      const shedule = new Shedule({
        days,
        period,
        locatie: loc,
        salePoint,
        periods: lastShedule && lastShedule.periods.length ? lastShedule.periods : basicPeriods,
        colors: lastShedule && lastShedule.colors ? lastShedule.colors : undefined
      });
  
      const savedShedule = await shedule.save();
      res.status(200).json(savedShedule);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };
  


function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }


  module.exports.deleteShedule = async (req, res) => {
    const {id} = req.query
    try{
      const sh = await Shedule.findById(id)
      if(sh){
        if(sh.users?.length){
          res.status(401).json({messgae: 'Sunt pontați oameni pe acest program, pentru a-l putea șterge trebuie să fie gol!'})
        } else {
          await Shedule.findByIdAndDelete(id)
          res.status(200).json({message: 'Programul a fost șters cu succes!'})
        }
      } else {
        res.status(404).json({message: 'Erorare, programul nu a fost gasit, id- ' + id})
      }
    } catch(error) {
      console.log(error)
      res.status(500).json(error)
    }
  }

  
module.exports.addPontaj = async (req, res, next) => {
    const months = [
      'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
      'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
    ];
  
    const { loc, year: inputYear, month: inputMonth, salePoint } = req.body;
  
    try {
      let year = inputYear;
      let month = inputMonth;
  
      // Fallback to current UTC month/year if not provided
      if (typeof year !== 'number' || typeof month !== 'number') {
        const now = new Date();
        now.setUTCHours(0, 0, 0, 0);
        year = now.getUTCFullYear();
        month = now.getUTCMonth(); // 0-indexed
      }
  
      const daysInMonth = new Date(year, month + 1, 0).getUTCDate(); // Last day of month
  
      const days = [];
  
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(Date.UTC(year, month, i)); // Always UTC
        days.push({
          date: date.getTime(),
          number: i,
          users: [],
          workValue: 0
        });
      }

      const lastPontaj = await Pontaj.findOne(
        { locatie: loc, salePoint: salePoint },
        {},
        { sort: { _id: -1 } }
      );
  
      const pontaj = new Pontaj({
        days,
        month: `${months[month]} - ${year}`,
        workValue: 0,
        locatie: loc,
        salePoint: salePoint,
        colors: lastPontaj ? lastPontaj.colors : undefined
      });
      const newPontaj = await pontaj.save();
      res.status(200).json(newPontaj);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message });
    }
  };
  

module.exports.getPontaj = async (req, res, next) => {
    const {loc, pont, month, point} = req.query
    try{    
        if(pont === 'last'){
            const pontajs = await Pontaj.find({locatie: loc, salePoint: point})
                .sort({_id: -1})
                .limit(3)
                .populate({path: 'days.users.employeePosition'})
            const pontaj = getNowShedule(pontajs)    
            //  updateShedules(pontaj, loc)
            res.status(200).json(pontaj)
        }
        if(pont === 'all'){
            const ponts = await Pontaj.find({locatie: loc, salePoint: point}).populate({path: 'days.users.employeePosition'})
            // updateShedules(ponts)
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
            .populate({path: 'days.users.workPeriod.employeePosition'})
            const shedule = getNowShedule(shedules)
            res.status(200).json(shedule)
        }
        if(shedule === 'all'){
            const shedules = await Shedule.find({locatie: loc, salePoint: point})
                  .populate({path: 'days.users.employee', select: 'name employee.fullName'})
                  .populate({path: 'days.users.workPeriod.employeePosition'})
         
            res.status(200).json(shedules)
        }
    } catch(err){
        console.log(err)
        res.status(500).json({message: err})
    }
}



async function updateShedules(sh, loc) {
      try{
        const positions = await EmployeePosition.find({locatie: loc})
        // for(let sh of shedules){
          for(let d of sh.days){
            for( let u of d.users){
              if(u){
                if(!u.employeePosition){
                  const p = positions.find(po => po.name === u.position)
                  if(p) {
                    u.employeePosition = p._id
                    console.log('POZITIE GASITA ' + u.employee.fullName + ' ' + u.employeePosition)
                  } else {
                    console.log('pozitie negasita ' +  u.employee.fullName + ' ' + u.position)
                  }
                }
              }
            }
          }
          await sh.save()
          console.log('*************************************SHEDULE SAVED **************************************')
        // }
    
      } catch(err){
        console.log(err)
      }

}

module.exports.updateShedule = async (req, res, next) => {
    const {sheduleId, day, user, month, dayValue, loc, point} = req.body
    try{
        const pontaj = await Pontaj.findOne({month: month, locatie: loc, salePoint: point})
        const shedule = await Shedule.findById(sheduleId).populate({path: 'days.users.employee', select: 'employee.fullName'})
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
            pontaj.days[pontDayIndex].users[dayPontUserIndex].position =  user.workPeriod.position,
            pontaj.days[pontDayIndex].users[dayPontUserIndex].employeePosition = user.workPeriod.employeePosition,
            pontaj.days[pontDayIndex].users[dayPontUserIndex].concediu = user.workPeriod.concediu
            pontaj.days[pontDayIndex].users[dayPontUserIndex].medical = user.workPeriod.medical
            await pontaj.save()
        } else {
            const userToPush = {
                hours: user.workPeriod.hours,
                value: dayValue,
                employee: user.employee,
                position: user.workPeriod.position,
                employeePosition: user.workPeriod.employeePosition,
                concediu: user.workPeriod.concediu,
                medical: user.workPeriod.medical,
            }
            const newPontaj =  await Pontaj.findOneAndUpdate({month: month, locatie: loc}, {$push: {[`days.${pontDayIndex}.users`]: userToPush}}, {new: true})
        }

        const dayUserIndex = shedule.days[dayIndex].users.findIndex(obj => obj.employee._id.toString() === user.employee);
        if(dayUserIndex !== -1){
           shedule.days[dayIndex].users[dayUserIndex].workPeriod = user.workPeriod
           shedule.days[dayIndex].users[dayUserIndex].checkIn = user.checkIn
            const savedShedule =  await shedule.save() 
            const newShedule = await Shedule.findById(savedShedule._id)
                                  .populate({path: 'days.users.employee', select: 'employee.fullName'})
                                  .populate({path: 'days.users.workPeriod.employeePosition'})
           res.status(200).json(newShedule)
        } else {
          const newShedule = await Shedule.findOneAndUpdate({_id: sheduleId}, {$push: {[`days.${dayIndex}.users`]: user}}, {new: true})
                                .populate({path: 'days.users.employee', select: 'employee.fullName'})
                                .populate({path: 'days.users.workPeriod.employeePosition'})
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
            {new: true})
            .populate({path: 'days.users.employee', select: 'employee.fullName'})
            .populate({path: 'days.users.workPeriod.employeePosition'})
         
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


module.exports.addPosition = async(req, res) => {
  const {position} = req.body
  try{
    const p = new EmployeePosition(position)
    const sp = await p.save()
    res.status(200).json({message: `Functia ${sp.name} a fost salvată cu success!`, position: sp})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}

module.exports.getPositions = async(req, res) => {
  const {loc} = req.query
  try{
    const p = await EmployeePosition.find({locatie: loc})
    res.status(200).json(p)
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}

module.exports.editPosition = async(req, res) => {
  const {position} = req.body
  try{
    const np = await EmployeePosition.findByIdAndUpdate(position._id, position, {new: true})
    res.status(200).json({message: `Funcția ${position.name} a fost modificată cu success!`, position: np})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}

module.exports.deletePosition = async(req, res) => {
  const {id} = req.query
  try{
    await EmployeePosition.findByIdAndDelete(id)
    res.status(200).json({message: 'Funcția a fost șteasă cu success!'})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}

module.exports.updatePartialShedule = async (req, res) => {
  const {shedule} = req.body
  try{
    const newShedule = await Shedule.findByIdAndUpdate(shedule._id, shedule, {new: true})
          .populate({path: 'days.users.employee', select: 'employee.fullName'})
          .populate({path: 'days.users.workPeriod.employeePosition'})
    res.status(200).json({sh: newShedule, message: 'Modificările au fost efectuate cu success!'})
  } catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}


module.exports.updateAllPositions = async (req, res) => {
  const {positions} = req.body
  try{
    const po = JSON.parse(positions);
    const promises = po.map(async (p) => {
      const doc = await EmployeePosition.findById(p._id); 
      if (doc) {
        Object.assign(doc, p); 
        return doc.save();
      }
    });

    await Promise.all(promises);
    res.status(200).json({ message: 'Modificările au fost efectuate cu success!' });
  }catch(error){
    console.log(error)
    res.status(500).json(error)
  }
}
