
const { createDayReport } = require('../../utils/reports')
const Report = require('./../../models/office/report')
const Order = require('./../../models/office/product/order')
const {round, formatedDateToShow} = require('./../../utils/functions')
const User = require('./../../models/users/user')
const Ingredient = require('../../models/office/inv-ingredient')



module.exports.getReports = async(req, res, next) => {
    try{
        const {startDate, endDate, loc} = req.query
        const start = new Date(startDate).setUTCHours(0,0,0,0)
        const end = new Date(endDate).setUTCHours(0,0,0,0)
        const reports = await Report.find({day: {$gte: start, $lte: end}, locatie: loc}).sort({day: 1})
        const report = await createReport(reports)
        res.status(200).json(report)
    } catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.getReportsDates = async (req, res) => {
    try{
        console.log('hit the function')
        const {loc} = req.query
        const firstRep = await Report.find({locatie: loc}).sort({day: 1}).limit(1)
        const lastRep = await Report.find({locatie: loc}).sort({day: -1}).limit(1)
        const firstRepDate = firstRep[0].day
        const lastReportDate = lastRep[0].day
        res.status(200).json({start: firstRepDate, end: lastReportDate})
    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }
}


module.exports.getAllReports = async(req, res, next) => {
    try{
        const {loc} = req.query
        const reports = await Report.find({locatie: loc}).sort({day: -1}).limit(5)
        res.status(200).json(reports)
    } catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.deleteReport = async(req, res, next) => {
    try{
        const {id} = req.query
        if(id){
            console.log(id)
            const report = await Report.findByIdAndDelete(id)
            if(report){
                res.status(200).json({message: 'Raportul a fost ștes cu success'})
            } else {
                res.status(256).json({message: 'A apărut o eroare la ștergerea raportului'})
            }
        }
    } catch(err){
        console.elog(err)
        res.status(500).json(err)
    }
}







module.exports.updateRap = async(req, res, next) => {
    try{    

        // const cursor = await Ingredient.find({locatie: '655e2e7c5a3d53943c6b7c53'})
        // console.log(cursor.length)
        // let index = 1
        // for (let doc of cursor){
        //     const updatedLogs = doc.uploadLog.map(log => {
        //         if (log.uploadPrice === undefined || log.uploadPrice === null) {
        //             log.uploadPrice = doc.tvaPrice; // Set uploadPrice to tvaPrice
        //             index ++
        //             console.log(log)
        //         }
        //         return log;
        //     });
        //     await Ingredient.updateOne(
        //         { _id: doc._id },
        //         { $set: { uploadLog: updatedLogs } }
        //     );

        // }
        // console.log(index)

        // while (await cursor.hasNext()) {
        //     const doc = await cursor.next();

        //     // Loop through each uploadLog entry and update it if uploadPrice is missing
        //     const updatedLogs = doc.uploadLog.map(log => {
        //         if (log.uploadPrice === undefined || log.uploadPrice === null) {
        //             log.uploadPrice = doc.tvaPrice; // Set uploadPrice to tvaPrice
        //             index ++
        //             console.log(log)
        //         }
        //         return log;
        //     });

        //     // Update the document with the modified uploadLog array
        //     await Ingredient.updateOne(
        //         { _id: doc._id },
        //         { $set: { uploadLog: updatedLogs } }
        //     );
        // }
        // console.log(index)

        res.send('all good')
    } catch(err){   
        console.log(err)
    }
}


async function createReport(reports){
    const lastDay = new Date(reports[reports.length -1].day).getDate()
    const start = formatedDateToShow(reports[0].day).split('ora')[0]
    const end = formatedDateToShow(reports[reports.length -1].day).split('ora')[0]
    let period = ''
    reports.length === 1 ? period = start : period = `${start} -- ${end}`

    const report = {
        period: period,
        cashIn: 0,
        vatValue: 0,
        cashInNoVat: 0,
        ingsValue: 0,
        rentValue: 0,
        diverse: {
            total: 0,
            entry: []
        },
        impairment: {
            total: 0,
            products: []
        },
        workValue: {
            total: 0,
            tax: 0,
            users: []
        },
        supliesValue: reports[reports.length -1].supliesValue,
        serviceValue: reports[reports.length -1].serviceValue ? reports[reports.length -1].serviceValue : 0,
        marketingValue: reports[reports.length -1].marketingValue ? reports[reports.length -1].marketingValue : 0,
        inventarySpendings: reports[reports.length -1].inventarySpendings ? reports[reports.length -1].inventarySpendings : 0,
        gasValue: reports[reports.length -1].gasValue ? reports[reports.length -1].gasValue : 0,
        constructionsValue: reports[reports.length -1].constructionsValue ? reports[reports.length -1].constructionsValue : 0,
        rent: reports[reports.length -1].rent ? reports[reports.length -1].rent : 0,
        utilities: reports[reports.length -1].utilities ? reports[reports.length -1].utilities : 0,
        departaments: [],
        paymentMethods: [],
        hours: [],
        users: [],
    }
    for(const rep of reports) {
        report.cashIn = round(report.cashIn + rep.cashIn)
        report.vatValue = round(report.vatValue + rep.vatValue)
        report.cashInNoVat = round(report.cashInNoVat + rep.cashInNoVat)
        report.ingsValue = round(report.ingsValue + rep.ingsValue)
        report.rentValue = round(report.rentValue + rep.rentValue)
        report.impairment.total = round(report.impairment.total + rep.impairment.total)
        report.workValue.total = round(report.workValue.total + rep.workValue.total)
        report.workValue.tax = round(report.workValue.tax + rep.workValue.tax)
        
        for (let user of rep.workValue.users){
            const existingUser = report.workValue.users.find(usr => usr.name === user.name)
            if(existingUser){
                existingUser.hours += user.hours
                existingUser.totalIncome = round(existingUser.totalIncome + user.totalIncome)
                existingUser.taxValue = round(existingUser.taxValue + user.taxValue)
                existingUser.bonus = round(existingUser.bonus + user.bonus)
            } else {
                report.workValue.users.push(user)
            }
        }
        for( let dep of rep.departaments) {
    
            const existingDep = report.departaments.find(d => d.name === dep.name)
            if(existingDep){
                existingDep.total = round(existingDep.total + dep.total)
                existingDep.procent = round(existingDep.total * 100 / report.cashIn)
                dep._doc.products.forEach(prod => {
                    let index = existingDep.products.findIndex(p => p.name === prod.name)
                    if(index !== -1 ){
                        existingDep.products[index].qty += prod.qty
                    } else {
                        const product = prod._doc
                        existingDep.products.push(product)
                    }
                })
            } else {
                report.departaments.push(dep)
            }
        }

        for(let payMethod of rep.paymentMethods){
            const existingPay = report.paymentMethods.find(m => m.name === payMethod.name)
            if(existingPay){
                existingPay.value = round(existingPay.value + payMethod.value)
                existingPay.procent = round(existingPay.value * 100 / report.cashIn)
                existingPay.bills = [...existingPay.bills, ...payMethod.bills]
            } else {
                report.paymentMethods.push(payMethod)
            }
        }

        for( let user of rep.users){
            const existingUser = report.users.find(u => u.name === user.name)
            if(existingUser){
                existingUser.total = round(existingUser.total + user.total)
                existingUser.procent = round(existingUser.total * 100 / report.cashIn)
            } else {
                report.users.push(user)
            }
        }

        for( let hour of rep.hours) {
            const existingHour = report.hours.find(h=> h.hour === hour.hour)
            if(existingHour){
                existingHour.total = round(existingHour.total + hour.total)
                existingHour.procent = round(existingHour.total * 100 / report.cashIn)
            } else {
                report.hours.push(hour)
            }
        }

        for( let product of rep.impairment.products) {
            const existingProd = report.impairment.products.find(p => p.name === product.name)
            if(existingProd){
                existingProd.qty += product.qty
            } else {
                report.impairment.products.push(product)
            }
        }

        for( let entry of rep.diverse.entry){
            const existingEntry = report.diverse.entry.find(e => e.index === entry.index)
            if(!existingEntry){
                report.diverse.entry.push(entry)
                report.diverse.total = round(report.diverse.total + entry.value)

            }
        }

    }
    return report
}