const Day = require('../models/cash-register/day')


const createCashRegisterDay = async () => {
  const currentDate = new Date()
  let defaultValue = 0
  const latestDocument = await Day.findOne({ locatie: "True" }, null, { sort: { date: -1 } });
  
  let startDate = latestDocument ? latestDocument.date : currentDate;
  let cashIn = latestDocument ? latestDocument.cashOut : defaultValue;

  
  while (startDate < currentDate) {
    const existingDocument = await Day.findOne({ date: startDate });
    if (!existingDocument) {
      startDate.setUTCHours(0,0,0,0)
      const newDocument = new Day({ date: startDate, cashIn: cashIn});
      await newDocument.save();
      console.log(newDocument)
      console.log('Document created for', startDate);
    }
    startDate.setDate(startDate.getDate() + 1);
    console.log(startDate)
  }
};

module.exports = createCashRegisterDay