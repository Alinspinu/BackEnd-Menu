
const { createDayReport } = require('../../utils/reports')
const Report = require('./../../models/office/report')
const Order = require('./../../models/office/product/order')
const {round, formatedDateToShow} = require('./../../utils/functions')
const User = require('./../../models/users/user')



module.exports.getReports = async(req, res, next) => {
    try{
        const {startDate, endDate, loc} = req.query
        const start = new Date(startDate).setUTCHours(0,0,0,0)
        const end = new Date(endDate).setUTCHours(0,0,0,0)
        const reports = await Report.find({day: {$gte: start, $lte: end}}).sort({day: 1})
        const report = await createReport(reports)
        res.status(200).json(report)
    } catch(err) {
        console.log(err)
        res.status(500).json({message: err.message})
    }
}


module.exports.updateRap = async(req, res, next) => {
    try{
        // const startDate = new Date('2024-05-01T00:00:00Z');
        // const endDate = new Date('2024-06-06T23:59:59Z');
        // const reports = await Report.find({})
        // const bills = await Order.find({createdAt: {$gte: startDate, $lte: endDate}}).select(['index', 'createdAt'])
        // const saveReports = reports.map(async (report) => {
        //         for (let method of report.paymentMethods) {
        //             for( let bill of method.bills){
        //                 for (let dbBill of bills) {
        //                     if (bill.index === dbBill.index) {
        //                         bill.createdAt = dbBill.createdAt;
        //                         bill.updatedAt = dbBill.updatedAt
        //                     }
        //                 }
        //             }
        //         }
        //         return report.save();
        // });
        // await Promise.all(saveReports);
        // res.send('all good')

        // const users = await User.find({ 'employee.fullName': { 
        //     $exists: true,                                     
        //   }
        // }).select(['employee.payments'])
        // console.log(users.length)
        // const savedUsers = users.map(async (user) => {
        //     for(let payment of user.employee.payments){
        //         const docMonth = new Date(payment.date).getMonth()

        //         payment.workMonth = docMonth 
        //     }
        //     return user.save()
        // })
        // await Promise.all(savedUsers)
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

    }
    return report
}