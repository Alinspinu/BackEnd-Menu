const Day = require('../models/office/cash-register/day')

const createCashRegisterDay = async (loc) => {
  const currentDate = new Date()
  currentDate.setUTCHours(0,0,0,0)
  let defaultValue = 0
  const latestDocument = await Day.findOne({ locatie: loc }, null, { sort: { date: -1 } });
  if(!latestDocument){
    const firtsDay = new Day({locatie: loc}) 
    firtsDay.save()
  }
  
  let stDate = latestDocument ? latestDocument.date : currentDate;
  let cashIn = latestDocument ? latestDocument.cashOut : defaultValue;
  const strDate = new Date(stDate)
  strDate.setUTCHours(0,0,0,0)
  let startDate = strDate

  while (startDate.getTime() <= currentDate.getTime()) {
    let inDate = new Date(startDate)
    inDate.setUTCHours(0,0,0,0)
    const existingDocument = await Day.findOne({locatie: loc, date: startDate });  
    if (!existingDocument) {
      const newDocument = new Day({locatie: loc, date: startDate, cashIn: cashIn});
      await newDocument.save();
      console.log('Document created for', startDate);
    }
    startDate.setDate(startDate.getDate() + 1);


    if (inDate.getTime() === startDate.getTime()) {
          console.log('Dates are equal');
          break;
    }
  }
};

module.exports = createCashRegisterDay