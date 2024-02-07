const Day = require('../models/office/cash-register/day')

const createCashRegisterDay = async (loc) => {
  const currentDate = new Date()
  let defaultValue = 0
  const latestDocument = await Day.findOne({ locatie: loc }, null, { sort: { date: -1 } });
  if(!latestDocument){
    const firtsDay = new Day({locatie: loc}) 
    firtsDay.save()
  }
  
  let startDate = latestDocument ? latestDocument.date : currentDate;
  let cashIn = latestDocument ? latestDocument.cashOut : defaultValue;
  
  
  while (startDate < currentDate) {
    const existingDocument = await Day.findOne({locatie: loc, date: startDate });  
    if (!existingDocument) {
      startDate.setUTCHours(0,0,0,0)
      const newDocument = new Day({locatie: loc, date: startDate, cashIn: cashIn});
      await newDocument.save();
      console.log('Document created for', startDate);
    }
    startDate.setDate(startDate.getDate() + 1);
  }
};

module.exports = createCashRegisterDay