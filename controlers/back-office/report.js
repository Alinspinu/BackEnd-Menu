
const Report = require('./../../models/office/report')
const Survey = require('../../models/office/survey')
const {round, formatedDateToShow} = require('./../../utils/functions')





module.exports.addSurvey = async (req, res) => {
    const {survey} = req.body
    try{
        const newSurvey = new Survey(survey)
        const savedSurvey = await newSurvey.save()
        res.status(200).json(savedSurvey)
    }catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.editSurvey = async (req, res) => {
    const {survey} = req.body
    try{
        const updatedSurvey = await Survey.findByIdAndUpdate(survey._id, survey, {new: true})
        res.status(200).json(updatedSurvey)
    }catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getSurveys = async (req, res) => {
    const {loc} = req.query
    try{
        const surveys = await Survey.find({locatie: loc}).sort({createdAt: -1})
        res.status(200).json(surveys)
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getSurvey = async (req, res) => {
    const {id} = req.query
    try{
        const survey = await Survey.findById(id)
        res.status(200).json(survey)
    }catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}


module.exports.getReports = async(req, res, next) => {
    try{
        const {startDate, endDate, loc} = req.query
        const start = new Date(startDate).setUTCHours(0,0,0,0)
        const end = new Date(endDate).setUTCHours(0,0,0,0)
        const reports = await Report.find({period: {$exists: false}, day: {$gte: start, $lte: end}, locatie: loc}).sort({day: 1})
        const report = await createReport(reports)
        res.status(200).json(report)
    } catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.saveReport = async(req, res) => {
    const {report} = req.body
    try{
        const newReport = new Report(report)
        const savedReport = await newReport.save()
        res.status(200).json({message: 'Raportul a fost salvat cu success!', report: savedReport})
    } catch(error) {
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getLastReport = async (req, res) => {
    const {loc, point} = req.query
    try{
        const report = await Report.find({locatie: loc, salePoint: point, period: { $exists: true }})
                    .sort({_id: -1})
                    .limit(1)
                    .populate({path: 'reports', select: 'cashIn ingsValue workValue day impairment'})
        res.status(200).json(report[0])
    } catch(error){
        console.log(error)
        res.status(500).json(error)
    }
}

module.exports.getReportsDates = async (req, res) => {
    try{
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

module.exports.deleteReports = async(req, res) => {
    try{
        const {loc, start, end} = req.query;
        const startDate = new Date(start).getTime()
        const endDate = new Date(end).getTime()
        Report.deleteMany({locatie: loc, day: {$gte: startDate, $lte: endDate}})
            .then(result => {
                console.log(result)
                res.status(200).json({message: `${result.deletedCount} Rapoarte au fost sterse!`})
        })
            .catch(error => {
                console.log(error)
                res.status(500).json(error)
            })
        

    } catch(err){
        consol.elog(err)
        res.status(500).json(err)
    }
}



async function createReport(reports){
    const start = formatedDateToShow(reports[0].day).split('ora')[0]
    const end = formatedDateToShow(reports[reports.length -1].day).split('ora')[0]
    let period = ''
    reports.length === 1 ? period = start : period = `${start} -- ${end}`
    const lastReport = reports[reports.length -1]
    const report = {
        period: period,
        reports: reports,
        salePoint: lastReport.salePoint,
        locatie: lastReport.locatie,
        cashIn: 0,
        vatValue: 0,
        day: reports[0].day,
        endDay: lastReport.day,
        cashInNoVat: 0,
        ingsValue: 0,
        rentValue: 0,
        reports: reports.map(r => r._id),
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
        supliesProdBuc: 0,
        supliesMfBuc: 0,
        supliesProdBar: 0,
        supliesMfBar: 0,
        supliesValue: {
            total: 0,
            entries: []
        },
        serviceValue: {
            total: 0,
            entries: []
        },
        marketingValue: {
            total: 0,
            entries: []
        },
        inventarySpendings: {
            total: 0,
            entries: []
        },
        gasValue: {
            total: 0,
            entries: []
        },
        constructionsValue: {
            total: 0,
            entries: []
        },
        rent: {
            total: 0,
            entries: [],
        },
        utilities: {
            total: 0,
            entries: []
        },
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
        report.supliesProdBuc = round(report.supliesProdBuc + rep.supliesProdBuc)
        report.supliesMfBuc = round(report.supliesMfBuc + rep.supliesMfBuc)
        report.supliesProdBar = round(report.supliesProdBar + rep.supliesProdBar)
        report.supliesMfBar = round(report.supliesMfBar + rep.supliesMfBar)
        report.supliesValue = {
            total: round(report.supliesValue.total + rep.supliesValue.total),
            entries: [...report.supliesValue.entries, ...rep.supliesValue.entries]
        }
        report.serviceValue = {
            total: round(report.serviceValue.total + rep.serviceValue.total),
            entries: [...report.serviceValue.entries, ...rep.serviceValue.entries]
        }
        report.marketingValue = {
            total: round(report.marketingValue.total + rep.marketingValue.total),
            entries: [...report.marketingValue.entries, ...rep.marketingValue.entries]
        }
        report.inventarySpendings = {
            total: round(report.inventarySpendings.total + rep.inventarySpendings.total),
            entries: [...report.inventarySpendings.entries, ...rep.inventarySpendings.entries]
        }
        report.gasValue = {
            total: round(report.gasValue.total + rep.gasValue.total),
            entries: [...report.gasValue.entries, ...rep.gasValue.entries]
        }
        report.rent = {
            total: round(report.rent.total + rep.rent.total),
            entries: [...report.rent.entries, ...rep.rent.entries]
        }
        report.utilities = {
            total: round(report.utilities.total + rep.utilities.total),
            entries: [...report.utilities.entries, ...rep.utilities.entries]
        }


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

                dep._doc.dep.forEach(dep => {
                    const index = existingDep.dep.findIndex(d=> d.name === dep.name)
                    if(index !== -1){
                        existingDep.dep[index].total += +dep.total
                        existingDep.dep[index].procent = round(existingDep.dep[index].total * 100 / +dep.total)
                    } else{
                        const dept = dep._doc
                        existingDep.dep.push(dept)
                    }
                })

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




module.exports.updateRap = async(req, res, next) => {
    // try{    

    //     const cursor = await Ingredient.find({locatie: '655e2e7c5a3d53943c6b7c53'})
    //     console.log(cursor.length)
    //     let index = 1
    //     for (let doc of cursor){
    //         const updatedLogs = doc.uploadLog.map(log => {
    //             if (log.uploadPrice === undefined || log.uploadPrice === null) {
    //                 log.uploadPrice = doc.tvaPrice; // Set uploadPrice to tvaPrice
    //                 index ++
    //                 console.log(log)
    //             }
    //             return log;
    //         });
    //         await Ingredient.updateOne(
    //             { _id: doc._id },
    //             { $set: { uploadLog: updatedLogs } }
    //         );

    //     }
    //     console.log(index)

    //     while (await cursor.hasNext()) {
    //         const doc = await cursor.next();

    //         // Loop through each uploadLog entry and update it if uploadPrice is missing
    //         const updatedLogs = doc.uploadLog.map(log => {
    //             if (log.uploadPrice === undefined || log.uploadPrice === null) {
    //                 log.uploadPrice = doc.tvaPrice; // Set uploadPrice to tvaPrice
    //                 index ++
    //                 console.log(log)
    //             }
    //             return log;
    //         });

    //         // Update the document with the modified uploadLog array
    //         await Ingredient.updateOne(
    //             { _id: doc._id },
    //             { $set: { uploadLog: updatedLogs } }
    //         );
    //     }
    //     console.log(index)

    //     res.send('all good')
    // } catch(err){   
    //     console.log(err)
    // }
}