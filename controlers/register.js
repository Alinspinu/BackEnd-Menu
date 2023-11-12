const Day = require('../models/day');
const Entry = require('../models/entry');
const exceljs = require('exceljs');

module.exports.sendEntry = async (req, res, next) => {
    const data = req.query.date
    const page = req.query.page || 1;
    const limit = 3
        try{
            const documents = await Day.find().populate({path: "entry"})
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ date: -1 });
            res.status(200).json({message: 'all good', documents})
        } catch(err){
            console.log(err)
            res.status(500).json({message: 'Error'+ err})
        }
  
}

module.exports.createXcel = async (req, res, next) => {
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



// worksheet.addRow(['Name', 'Age', 'City']);
// worksheet.addRow(['John Doe', 30, 'New York']);
// worksheet.addRow(['Jane Smith', 25, 'Los Angeles']);

// // Save the workbook to a file

//   res.status(200)
}


function round(num) {
    return Math.round(num * 100) / 100;
}

