const Day = require('../../models/office/cash-register/day');
const Entry = require('../../models/office/cash-register/entry');
const exceljs = require('exceljs');
const createCashRegisterDay = require('../../utils/createDay')




module.exports.sendEntry = async (req, res, next) => {
    createCashRegisterDay()
    const data = req.query.date
    const page = req.query.page || 1;
    const limit = 3
        try{
            const documents = await Day.find({locatie: '655e2e7c5a3d53943c6b7c53' }).populate({path: "entry"})
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ date: -1 });
            res.status(200).json({message: 'all good', documents})
        } catch(err){
            console.log(err.message)
            res.status(500).json({message: 'Error'+ err})
        }
  
}


module.exports.addEntry = async (req, res, next) => {
    const { tip, date, description, amount } = req.body
    if(tip && date && description && amount){
        const entryDate = new Date(date)
        const newEntry = new Entry({
            tip: tip,
            date: entryDate,
            description: description,
            amount: tip === 'expense' ? -amount : amount,
            locatie: '655e2e7c5a3d53943c6b7c53',
        })
        newEntry.save()
        entryDate.setUTCHours(0,0,0,0)
        const nextDay = new Date(entryDate);
        nextDay.setDate(entryDate.getDate() + 1);
        const day = await Day.findOne({ date: { $gte: entryDate, $lt: nextDay} }).populate({ path: 'entry' })
        if (day) {
            const daySum = day.entry.reduce((total, doc) => total + doc.amount, 0)
            day.entry.push(newEntry)
            const dayTotal = daySum + newEntry.amount + day.cashIn
            day.cashOut = dayTotal
            await day.save()
            res.status(200).json(day)
        } 
    } else {
        res.status(226).json({message: 'Nu ai completat toate campurile mai incearca.. :)'})
    }
}



module.exports.deleteEntry = async (req, res, next) => {
    const { id } = req.query;
    try {
        const entry = await Entry.findById(id)
        const day = await Day.findOne({ date: entry.date })
        await entry.deleteOne();
        await Day.findOneAndUpdate({ _id: day._id }, { $pull: { entry: entry._id } }).exec()
        day.cashOut = day.cashOut - entry.amount
        if(!day.entry.length){
            day.cashOut = day.cashIn
        }
        day.save()
        res.status(200).json({ message: `Entry ${entry.description}, with the amount ${entry.amount} was deleted` })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message })
    }
}





module.exports.createXcel = async (req, res, next) => {
    console.log('hit the route')
    const {startDate, endDate} = req.query
    const start = new Date(startDate).setUTCHours(0,0,0,0)
    const end = new Date(endDate).setUTCHours(0,0,0,0)
    try{
        const workbook = new exceljs.Workbook();
        const worksheet = workbook.addWorksheet('Sheet 1');

        const days = await Day.find({ date:{ $gte: start, $lte: end} }).populate({ path: 'entry' })
        const day1 = days[0]
        const lastDay = days.at(-1)
        const header = ['Nr',`Data`,'Descriere','Tip', `Lei`]
        const cashIn = ['Sold Ințial',``,'','', `${round(day1.cashIn)}`]
        const footer = ['Sold Final','','',' ', `${round(lastDay.cashOut)}`] 
        worksheet.addRow(cashIn)
        worksheet.addRow(header)
        days.forEach(el => {
            el.entry.forEach(el => {
                worksheet.addRow([`${el.index}`,`${el.date.toISOString().split('T')[0]}`,`${el.description}`,`${el.tip === 'income' ?'Intrare': 'Cheltuiala'}`,`${el.amount}`])
            })
        })
        worksheet.addRow(footer)
        worksheet.getRow(1).eachCell((cell)=>{
            cell.font = {
                bold: true,
                size: 14
            }
        })
        worksheet.getRow(2).eachCell((cell)=>{
            cell.font = {
                bold: true,
                size: 13
            }
        })
        worksheet.lastRow.eachCell((cell)=>{
            cell.font = {
                bold: true,
                size: 14
            }
        })
        worksheet.getColumn(1).width = 7;
        worksheet.getColumn(2).width = 12; 
        worksheet.getColumn(3).width = 30; 
        worksheet.getColumn(4).width = 10; 
        worksheet.getColumn(5).width = 10; 
        worksheet.mergeCells('A1:D1')
        const lastRowNumber = worksheet.lastRow.number;
        worksheet.mergeCells(`A${lastRowNumber}:D${lastRowNumber}`)
        workbook.xlsx.writeFile('example.xlsx')
          .then(() => {
            console.log('Workbook created successfully');
          })
          .catch((error) => {
            console.error('Error creating workbook:', error);
          });
        res.status(200)
    }catch(err){
        console.log(err)
        res.status(500).json({message: "Error", err})
    }
}


function round(num) {
    return Math.round(num * 100) / 100;
}

