const Day = require('../models/office/cash-register/day')

const createCashRegisterDay = async () => {
  const loc = '655e2e7c5a3d53943c6b7c53'
  const currentDate = new Date()
  let defaultValue = 0
  const latestDocument = await Day.findOne({ locatie: loc }, null, { sort: { date: -1 } });
  
  let startDate = latestDocument ? latestDocument.date : currentDate;
  let cashIn = latestDocument ? latestDocument.cashOut : defaultValue;

  
  while (startDate < currentDate) {
    const existingDocument = await Day.findOne({locatie: loc, date: startDate });
    if (!existingDocument) {
      startDate.setUTCHours(0,0,0,0)
      const newDocument = new Day({locatie: loc, date: startDate, cashIn: cashIn});
      await newDocument.save();
      console.log(newDocument)
      console.log('Document created for', startDate);
    }
    startDate.setDate(startDate.getDate() + 1);
    console.log(startDate)
  }
};

module.exports = createCashRegisterDay