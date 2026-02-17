const Day = require('../../models/office/cash-register/day');
const Entry = require('../../models/office/cash-register/entry');
const User = require('../../models/users/user')
const exceljs = require('exceljs');
const createCashRegisterDay = require('../../utils/createDay')
const Suplier = require('../../models/office/suplier');
const { isArray } = require('util');




module.exports.sendEntry = async (req, res, next) => {
    const{loc, point} = req.query
        createCashRegisterDay(loc, point)
            try{
                const documents = await Day.find({locatie: loc, salePoint: point}).populate({path: "entry"})
                .limit(40)
                .sort({ date: -1});
                const sortedDocs = documents.sort((a,b) => {
                    const aDate = new Date(a.date).getTime()
                    const bDate = new Date(b.date).getTime()
                    return aDate-bDate
                })
                res.status(200).json({message: 'all good', documents: sortedDocs})
            } catch(err){
                console.log(err.message)
                res.status(500).json({message: 'Error'+ err})
            }
}

module.exports.getDocumentsByDate = async (req, res) => {
    const {loc, point, start, end} = req.body
    try{
        const startDate = new Date(start).setUTCHours(0,0,0,0)
        const endDate = new Date(end).setUTCHours(0,0,0,0)
        const documents = await Day.find({locatie: loc, salePoint: point, date: {$gte: startDate, $lte: endDate}})
        .populate({path: "entry"})
        .sort({ date: -1});
        const sortedDocs = documents.sort((a,b) => {
            const aDate = new Date(a.date).getTime()
            const bDate = new Date(b.date).getTime()
            return aDate-bDate
        })
        res.status(200).json({message: 'all good', documents: sortedDocs})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.creataDaty = async (req, res) => {
    try{
        const date = new Date('2024-06-01')
        date.setUTCHours(0,0,0,0)
        const day = new Day({
            locatie: '655e2e7c5a3d53943c6b7c53',
            date: date
        })
        const newDay = await day.save()

        res.status(200).json(newDay)

    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }
}


module.exports.deleteDay = async (req, res, next) => {
    const {id} = req.query
    try{
        await Day.findByIdAndDelete(id)
        res.status(200).json({message: 'Ziua a fost ștearsă cu success!'})
    } catch (error) {
        console.log(error)
        res.status(500).json(error)
    }
  }


module.exports.addEntry = async (req, res, next) => {
    const { tip, date, typeOf, suplier, user, description, document, amount, locatie, month, asociat, salePoint } = req.body
    createCashRegisterDay(locatie, salePoint)
    if(tip && date && amount){
        const entryDate = new Date(date)
        const newEntry = new Entry({
            tip: tip,
            date: entryDate,
            description: description,
            amount: tip === 'expense' ? -amount : amount,
            locatie: locatie,
            typeOf: typeOf,
            suplier: suplier,
            user: user,
            document: document,
            salePoint: salePoint
        })
        console.log(newEntry)
        if(typeOf === 'Plata furnizor' && !asociat){
            const sup = await Suplier.findById(suplier).select('name sold')
            const record = {
                typeOf: 'iesire',
                document: {
                    typeOf: document.tip,
                    docId: document.number,
                    amount: amount,
                    asociat: false,
                    docRecords: [],
                },
                sold: sup.sold - amount,
                description: description,
                date: entryDate,
                salePoint: salePoint
            }
            await Suplier.findByIdAndUpdate(
                suplier,  
                { $push: { records: record }, $inc: { sold: - amount }},
                { new: true, useFindAndModify: false })
        }
        if(typeOf === 'Bonus vanzari'){
            const payment = {
                amount: amount / user.length,
                tip: typeOf,
                date: entryDate,
                workMonth: month,
                salePoint: salePoint
            }
            for(let id of user){
            await User.findOneAndUpdate({_id: id}, {$push: {'employee.payments': payment}})
            }
        }
        console.log('user', user)
        if(user && user.length && typeOf !== 'Bonus vanzari' && typeOf !== 'Plata furnizor'){
            const userId = Array.isArray(user) ? user[0] : user
            const payment = {
                amount: amount,
                tip: typeOf,
                date: entryDate,
                workMonth: month,
                salePoint: salePoint
            }
           await User.findOneAndUpdate({_id: userId}, {$push: {'employee.payments': payment}})
        }
       entryDate.setUTCHours(0,0,0,0)
       const saved = await newEntry.save()
       console.log('saved', saved)
        const nextDay = new Date(entryDate);
        nextDay.setDate(entryDate.getDate() + 1);
        const day = await Day.findOne({ date: { $gte: entryDate, $lt: nextDay}, locatie: locatie, salePoint: salePoint }, null, {new: true}).populate({ path: 'entry' })
        console.log('day', day)
        if (day) {
            const daySum = day.entry.reduce((total, doc) => total + doc.amount, 0)
            day.entry.push(saved)
            const dayTotal = daySum + newEntry.amount + day.cashIn
            day.cashOut = dayTotal
            await day.save()
            res.status(200).json(day)
        } else {
  
        }
    } else {
        res.status(226).json({message: 'Nu ai completat toate campurile mai incearca.. :)'})
    }
}



module.exports.deleteEntry = async (req, res, next) => {
    const { id } = req.query;
    try {
        const entry = await Entry.findById(id)
        console.log('entry', entry)
        const day = await Day.findOne({locatie: entry.locatie, date: entry.date })
        console.log('day', day)
        await entry.deleteOne();
        const newDay = await Day.findOneAndUpdate({ _id: day._id }, { $pull: { entry: entry._id } }, {new: true}).exec()
        if(!newDay.entry.length){
            day.cashOut = day.cashIn
        }
        newDay.cashOut -= entry.amount
        await newDay.save()
        if(entry.typeOf === 'Bonus vanzari'){
            const payment = {
                amount: Math.abs(entry.amount / entry.user.length),
                tip: entry.typeOf,
                date: entry.date
            }
            for(let id of entry.user){
                const query = {
                    _id: id,
                }
            await User.findOneAndUpdate(query, {$pull: {'employee.payments': payment}})
            }
        }
        if((entry.user.length) && entry.typeOf !== 'Bonus vanzari' && entry.typeOf !== 'Plata furnizor'){
            const payment = {
                amount: Math.abs(entry.amount),
                tip: entry.typeOf,
                date: entry.date
            }
            const query = {
                _id: entry.user[0],
            }
           await User.findOneAndUpdate(query, {$pull: {'employee.payments': payment}})
        }
        if(entry.typeOf === "Plata furnizor" && entry.suplier){
            await Suplier.findByIdAndUpdate(
                entry.suplier,
                { 
                    $pull: { records: { 'document.docId': entry.document.number } },
                    $inc: { sold: - entry.amount }
                },
                { new: true, useFindAndModify: false }
                );
        }
        res.status(200).json({ message: `Entry ${entry.description}, with the amount ${entry.amount} was deleted` })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: err.message })
    }
}

module.exports.showDocs = async (req, res, next) => {
    try{    
        const {startDate, endDate, loc, point} = req.body
        const start = new Date(startDate).setUTCHours(0,0,0,0)
        const end = new Date(endDate).setUTCHours(0,0,0,0)
        const days = await Day.find({locatie: loc, date:{ $gte: start, $lte: end}, salePoint: point }).populate({ path: 'entry' }).sort({ date: -1 });
        res.status(200).json({message: 'all good', documents: days})
    
    } catch(err){
        console.log(err)
        res.status(500).json({message: err.message})
    }
}




module.exports.createXcel = async (req, res, next) => {
    const {startDate, endDate, loc, point} = req.body
    const start = new Date(startDate).setUTCHours(0,0,0,0)
    const end = new Date(endDate).setUTCHours(0,0,0,0)
    const startDateToShow = new Date(startDate).toISOString().split('T')[0]
    const endDateToShow = new Date(endDate).toISOString().split('T')[0]
    try{
        const workbook = new exceljs.Workbook();
        const days = await Day.find({locatie: loc, date:{ $gte: start, $lte: end}, salePoint: point }).populate({ path: 'entry' }).populate({path: 'locatie'})      
        const worksheet = workbook.addWorksheet('Sheet 1');
        const docTitle =  [
            `${days[0].locatie.bussinessName}`,'',`Registru de casă perioadă ${startDateToShow} -- ${endDateToShow}`,'','']
        const header = ['Nr',`Data`,'Descriere','Tip', `Lei`]
        worksheet.addRow(docTitle)
        worksheet.addRow([])
        worksheet.addRow([])
        worksheet.addRow(header)

        days.reverse().forEach((el, i) => {
          const head =  worksheet.addRow([`${i+1}`,`${el.date.toISOString().split('T')[0]}`,`Numerar din ziua precedentă`,`Intrare`,`${round(el.cashIn)}`])
            head.eachCell((cell) => {
                cell.font = {
                size: 13,
                bold: true,
                };
            });
            el.entry.forEach((el, i) => {
               const e = worksheet.addRow([`${i+1}`,`${el.date.toISOString().split('T')[0]}`,`${el.description}`,`${el.tip === 'income' ?'Intrare': 'Ieșire'}`,`${el.amount}`])
               const sum = e.getCell(5)
               sum.font =  { color:  {argb: el.tip === 'income' ?  'FF00B050' : 'FF0000'} }
            });
         
           const foot =  worksheet.addRow(['',`${el.date.toISOString().split('T')[0]}`,`Numerar la sfârșit de zi`,`Ieșire`,`${round(el.cashOut)}`])
            foot.eachCell((cell) => {
                cell.font = {
                size: 13,
                bold: true,
                };
            });
            worksheet.addRow([])
        
        })
   
        worksheet.getRow(1).eachCell((cell)=>{
            cell.font = {
                bold: true,
                size: 13
            }
        })
        worksheet.getRow(4).eachCell((cell)=>{
            cell.font = {
                bold: true,
                size: 14
            }
        })
        worksheet.getColumn(1).width = 7;
        worksheet.getColumn(2).width = 12; 
        worksheet.getColumn(3).width = 60; 
        worksheet.getColumn(4).width = 10; 
        worksheet.getColumn(5).width = 10; 
        worksheet.mergeCells('A1:B2')
        worksheet.mergeCells('C1:E2')

          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', 'attachment; filename=example.xlsx');

          workbook.xlsx.write(res)
          .then(() => {
            res.end();
          })
          .catch((error) => {
            console.error('Error writing Excel file:', error);
            res.status(500).send('Internal Server Error');
          });
    }catch(err){
        console.log(err)
        res.status(500).json({message: "Error", err})
    }
}

function round(num) {
    return Math.round(num * 100) / 100;
}

