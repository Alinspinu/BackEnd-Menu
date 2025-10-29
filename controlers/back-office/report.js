
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

module.exports.getReportById = async(req, res) => {
    const {id} = req.query
    try{
    const rep = await Report.findById(id).populate({path: 'reports', select: 'cashIn ingsValue workValue day impairment'})
    res.status(200).json(rep)
    } catch(e){
        console.log(e)
        res.status(500).json(e)
    }
}


module.exports.getReports = async(req, res, next) => {
    try{
        const {startDate, endDate, loc, point} = req.query
        const start = new Date(startDate).setUTCHours(0,0,0,0)
        const end = new Date(endDate).setUTCHours(0,0,0,0)
        const reports = await Report.find({period: {$exists: false}, day: {$gte: start, $lte: end}, locatie: loc, salePoint: point}).sort({day: 1})
        if(reports.length){
            const report = await createReport(reports)
            const rep = new Report(report)
            const r = await rep.save()
            res.status(200).json(r)
        }else {
            res.status(404).json({message: 'No Reports'})
        }
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
        const {loc, point} = req.query
        const firstRep = await Report.find({locatie: loc, salePoint: point}).sort({day: 1}).limit(1)
        const lastRep = await Report.find({locatie: loc, salePoint: point}).sort({day: -1}).limit(1)
        if(firstRep.length){
            const firstRepDate = firstRep[0].day
            const lastReportDate = lastRep[0].day
            res.status(200).json({start: firstRepDate, end: lastReportDate})
        } else {
            return res.status(404).json({message: 'NU exista rapoarte salvate!'})
        }
    } catch(err){
        console.log(err)
        res.status(500).json(err)
    }
}


module.exports.getAllReports = async(req, res, next) => {
    try{
        const {loc, point, limit = 30} = req.query
        const reports = await Report.find({locatie: loc, salePoint: point, period: { $exists: false }}).sort({day: -1}).limit(limit)
        res.status(200).json(reports)
    } catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}

module.exports.getPeriodReports = async (req, res) => {
    const {loc, point, limit = 30} = req.query
    try{
       const reports = await Report.find({locatie: loc, salePoint: point, period: { $exists: true }})
                .sort({day: -1})
                .limit(limit)
                .populate({path: 'reports', select: 'cashIn ingsValue workValue day impairment'})

       res.status(200).json(reports)
    } catch (e){
        console.log(e)
        res.status(500).json(e)
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
        const {loc, start, end, point} = req.query;
        const startDate = new Date(start).getTime()
        const endDate = new Date(end).getTime()
        Report.deleteMany({locatie: loc, salePoint: point, status: 'new', day: {$gte: startDate, $lte: endDate}})
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
        totalGestIncome: 0,
        totalSpendings: 0,
        profit: 0,
        // reports: reports.map(r => r._id),
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
        spendingsDeps: [],
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
        report.totalSpendings = round(report.totalSpendings +  rep.totalSpendings)
        report.totalGestIncome = round(report.totalGestIncome +  rep.totalGestIncome)
        report.profit = round(report.profit +  rep.profit)
        // console.log('spendings ', report.totalSpendings )
        // console.log('gestIncome ', report.totalGestIncome )

        for(let d of rep.spendingsDeps){
            const existingD = report.spendingsDeps.find(dd => dd.dep.toString() === d.dep.toString())
            if(existingD){
                existingD.total = round(existingD.total +  d.total)
                existingD.entries = [...existingD.entries, ...d.entries]
            } else {
                report.spendingsDeps.push(d)
            }
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
                existingDep.totalIn = round(existingDep.totalIn + dep.totalIn)
                existingDep.totalOut = round(existingDep.totalOut + dep.totalOut)
                // existingDep.procent = round(existingDep.total * 100 / report.cashIn)
                // existingDep.procent = round(existingDep.total * 100 / report.cashIn)

                dep.dep.forEach(dp => {
                    const d = existingDep.dep.find(d=> d.name === dp.name)
                    if(d){
                        d.totalIn += dp.totalIn
                        d.totalOut += dp.totalOut
                        d.totalRecipes += dp.totalRecipes
                        // existingDep.dep[index].procent = round(existingDep.dep[index].total * 100 / +dep.total)
                    } else{
                        existingDep.dep.push(dp)
                    }
                })

                dep.products.forEach(prod => {
                    let index = existingDep.products.findIndex(p => p.name === prod.name)
                    if(index !== -1 ){
                        existingDep.products[index].qty += prod.qty
                        existingDep.products[index].price += prod.price
                        existingDep.products[index].totalRecipe += prod.totalRecipe
                    } else {
                        const product = prod
                        existingDep.products.push(product)
                    }
                })
                existingDep.entries = [...existingDep.entries, ...dep.entries]
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
    // console.log('total gestIncome', report.totalGestIncome)
    // console.log('total spendings', report.totalSpendings)
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