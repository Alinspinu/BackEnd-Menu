
const {round} = require('./functions')
const Report = require('./../models/office/report')
const Pontaj = require('./../models/users/pontaj')
const DelProd = require('./../models/office/product/deletetProduct')
const Ingredient = require('./../models/office/inv-ingredient')
const User = require('./../models/users/user')
const Entry = require('../models/office/cash-register/entry')
const ImpSheet = require('../models/office/imp-sheet')


async function getBillProducts(orders, filter) {
    let products = [];
    let modifiedProducts = []
    let productsToSend = {
        buc: {
            products: [],
            ings: []
        },
        pat: {
            products: [],
            ings: []
        },
        shop: {
            products: [],
            ings: []
        },
        coffee: {
            products: [],
            ings: []
        },
        tea: {
            products: [],
            ings: []
        },
        bar: {
            products: [],
            ings: []
        },
        default:{
            products: [],
            ings: []
        },
    }

    for (const bill of orders) {
        if(!bill.dont && filter.inreg){
            if(filter.prod){
                await processBill(bill, 'productie');
            }
            if(filter.goods){
                await processBill(bill, 'marfa');
            }
        }
        if (filter.unreg && bill.dont) {
            if(filter.prod){
                await processBill(bill, 'productie');
            }
            if(filter.goods){
                await processBill(bill, 'marfa');
            }
        }
    }
    for(const product of products){   
           product.ingr = await getIngredients([product])
           modifiedProducts.push(product)
    }

    for(const product of modifiedProducts){
        switch(product.section) {
            case 'buc': 
                 productsToSend.buc.products.push(product)
                 break
            case 'vitrina': 
                productsToSend.pat.products.push(product)
                break
            case 'shop':
                productsToSend.shop.products.push(product)
                break
            case 'coffee':
                productsToSend.coffee.products.push(product)
                break
            case 'tea':
                productsToSend.tea.products.push(product)
                break
            case 'bar':
                productsToSend.bar.products.push(product)
                break
            default:
                productsToSend.default.products.push(product)
                break
        }
    }
    
    productsToSend.buc.ings = await getIngredients(productsToSend.buc.products)
    productsToSend.bar.ings = await getIngredients(productsToSend.bar.products)
    productsToSend.pat.ings = await getIngredients(productsToSend.pat.products)
    productsToSend.coffee.ings = await getIngredients(productsToSend.coffee.products)
    productsToSend.shop.ings = await getIngredients(productsToSend.shop.products)
    productsToSend.tea.ings = await getIngredients(productsToSend.tea.products)
    productsToSend.default.ings = await getIngredients(productsToSend.default.products)

    
    let result = {sections: productsToSend, allProd: modifiedProducts}
    return result;
    // return products;


    async function processBill(bill, department) {
        for (const prod of bill.products) {
            const product = prod._doc
            if (product.dep === department) {
                const existingProduct = products.find(p => p.name === product.name && arraysAreEqual(p.toppings, product.toppings));
                if (existingProduct) {
                    existingProduct.quantity += product.quantity;
                    existingProduct.discount += product.discount;
                } else {
                    if (product.toppings.length) {
                        product.toppings.forEach((top) => {
                            if (top && top.name === 'Lapte Vegetal') {
                                const index = product.ings.findIndex((i) => {
                                    if(i.ing){
                                       return i.ing.name === "Lapte"
                                    }
                                    else return -1
                                });
                                if (index !== -1) {
                                    product.ings.splice(index, 1);
                                }
                            }
                        });
                    }
                    const prod = { ...product };
                    products.push(prod);
                }

                }
            }
        }
    }

async function getIngredients(products){
    if(products){
        let ingredients = []
        for (const product of products){
            for (const ing of product.toppings){
                await pushIngredients(ing, product.quantity)
            }
            for(const ing of product.ings){
                await pushIngredients(ing, product.quantity)
            }
        }
        return ingredients


    async function pushIngredients(inx, prodQty){
        const ing = inx._doc
        if(ing.ing){
            if(ing.ing.productIngredient){
                for (let ingx of ing.ing.ings){
                    const ingg = ingx._doc
                    if(ingg.ing){
                        if(ingg.ing.productIngredient){
                            for (let inggx of ingg.ing.ings){
                                const inggg = inggx._doc
                                if(inggg.ing){
                                    const existingIng = ingredients.find(p => p.ing._id === inggg.ing._id)
                                    if(existingIng){
                                      existingIng.qty += (inggg.qty * prodQty * ingg.qty * ing.qty)
                                    } else {
                                      const ig = {...inggg}
                                      ig.qty = round(ig.qty * prodQty * ing.qty * ingg.qty)
                                      ingredients.push(ig)
                                    } 
                                }
                            }
                        } else {
                            const existingIng = ingredients.find(p => p.ing._id === ingg.ing._id)
                            if(existingIng){
                              existingIng.qty += (prodQty * ingg.qty * ing.qty)
                            } else {
                              const ig = {...ingg}
                              ig.qty = round(ig.qty * prodQty * ing.qty )
                              ingredients.push(ig)
                            } 
                        } 
                    } 
        
                }
            } else {
                    const existingIng = ingredients.find(p => p.ing._id === ing.ing._id)
                    if(existingIng){
                      existingIng.qty += (prodQty * ing.qty)
                    } else {
                      const ig = {...ing}
                      ig.qty = round(ig.qty * prodQty)
                      ingredients.push(ig)
                    } 
            }
    
        }
    }
    } else {
        return null
    }
}

const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];

async function createDayReport(billProducts, ingredients, loc, bills, dat) {
    const date = new Date(dat)
    const month = date.getUTCMonth()
    const year = date.getUTCFullYear()
    const pontMonth = `${months[month]} - ${year}`
    const daysNumber = getDaysInMonthFromDate(new Date(dat))
    const startTime = new Date(date).setUTCHours(0,0,0,0)
    const endTime = new Date(date).setUTCHours(23, 59, 59, 9999)

    console.log(date)

    const entries = await Entry.find({typeOf: 'Altele', date: {$gte: startTime, $lte: endTime}, tip: 'expense'})
    const pontaj = await Pontaj.findOne({locatie: loc, month: pontMonth}).populate('days.users.employee')
    const delProds = await DelProd.find({locatie: loc, createdAt: {$gte: startTime, $lt: endTime}, reason: 'dep'}).populate({path: 'billProduct.ings.ing', select: 'name'})
    const dbUsers = await User.find({locatie: loc, 'employee.fullName': {$exists: true}, 'employee.salary.inHeand': {$gte: 0} }).select('employee')
    const allIngs = await Ingredient.find({locatie: loc, productIngredient: false})
                    .select(['uploadLog', 'tvaPrice', 'dep', 'name', 'gestiune', 'dept', 'gest'])
                    .populate({path: 'gest', select: 'name'})
                    .populate({path: 'dept', select: 'name'})
    const impSheets = await ImpSheet.find({locatie: loc, date: {$gte: startTime, $lte: endTime}})
                                .populate({path: 'ings.ing', select: 'name um ings tvaPrice productIngredient', populate: {path: 'ings.ing', select: 'name um tvaPrice' }})
    const values = {
        workValueTotal: 0,
        dayRent: 60000 / daysNumber,
        totalBills: 0,
        totalIngredients: 0,
        taxValue: 0,
        vatVal: 0,
        totalDep: 0,
        totalSuplies: 0,
        serviceValue: 0,
        marketingValue: 0,
        inventarySpendings: 0,
        gasValue: 0,
        constructionsValue: 0,
        rentValue: 0,
        utilitiesValue: 0,
        cash: 0, 
        diverse: 0,
        cashBack: 0,
        discounts: 0,
        vivaWallet: 0,
        voucher: 0,
        payOnline: 0,
        tips: 0,
        card: 0,
        rent: 0,
        inIngsProdBuc: 0,
        inIngsMfBuc: 0,
        inIngsProdBar: 0,
        inIngsMfBar: 0, 
    }

    let workDays = []
    let users = []
    let discountBills = []
    let cashBackBills = []
    let voucherBills = []
    let fullBills = []
    let oldProd = []
    let depProducts = []
    let entryy = []
    let servEntryes = []
    let obInvEntryes = []
    let marketingEntryes = []
    let consEntryes = []
    let amenajariEntryes = []
    let utilitiesEntryes = []
    let combsEntryes = []
    let rentEntryes = []
 


    //CALC DEIVERSE

    entries.forEach(entry => {
        const index = entryy.find(e => e.index === entry.index)
        if(!index){
            values.diverse += Math.abs(entry.amount)
            const ent = {
                value: Math.abs(entry.amount),
                reason: entry.description,
                index: entry.index,
                date: entry.date
            }
            entryy.push(ent)
        } else {
            console.log(index)
        }
    })


    // CALC BILLS TOTALS

    bills.forEach(bill => {
        if(bill.discount > 0 || bill.discount > 0 && bill.status === 'done'){
                discountBills.push(bill)
        }
        if(bill.cashBack > 0 && bill.status === 'done'){
                cashBackBills.push(bill)
        }
        if(bill.voucher > 0 && bill.status === 'done'){
                voucherBills.push(bill)
        }
        if(bill.discount === 0 && bill.cashBack === 0 && bill.status === 'done') {
            fullBills.push(bill)
          }
        if(bill.payment.cash){
            values.cash += bill.payment.cash
        }
        if(bill.payment.card){
            values.card += bill.payment.card
        }
        if(bill.payment.viva){
            values.vivaWallet += bill.payment.viva
        }
        if(bill.payment.voucher){
            values.voucher += bill.payment.voucher
        }
        if(bill.payment.online){
            values.payOnline += bill.payment.online
        } 
        values.tips += bill.tips
        values.cashBack += bill.cashBack
        values.discounts += bill.discount
        values.totalBills += bill.total

    })


    // CREATE PAYMENT METHODS

    function createPaymentMethods(values){
        let paymentMethods = []
        if(values.totalBills > 0 && values.cash > 0){
            paymentMethods.push({
                name: 'Numerar',
                value: round(values.cash),
                procent: round(values.cash * 100 / values.totalBills),
                bills: []
            })
        }
        if(values.totalBills > 0 && values.card > 0){
            paymentMethods.push({
                name: 'Card',
                value: round(values.card),
                procent: round(values.card * 100 / values.totalBills),
                bills: []
            })
        }
        if(values.totalBills > 0 && values.vivaWallet > 0){
            paymentMethods.push({
                name: 'Viva Wallet',
                value: round(values.vivaWallet),
                procent: round(values.vivaWallet * 100 / values.totalBills),
                bills: []
            })
        }
        if(values.totalBills > 0 && values.voucher > 0){
            paymentMethods.push({
                name: 'Voucher',
                value: round(values.voucher),
                procent: round(values.voucher * 100 / values.totalBills),
                bills: voucherBills
            })
        }
        if(values.totalBills > 0 && values.cashBack > 0){
            paymentMethods.push({
                name: 'CashBack',
                value: round(values.cashBack),
                procent: round(values.cashBack * 100 / values.totalBills),
                bills: cashBackBills,
            })
        }
        if(values.totalBills > 0 && values.payOnline > 0){
            paymentMethods.push({
                name: 'Online',
                value: round(values.payOnline),
                procent: round(values.payOnline * 100 / values.totalBills),
                bills: []
            })
        }
        if(values.totalBills > 0 && values.tips > 0){
            paymentMethods.push({
                name: 'Bacsis',
                value: round(values.tips),
                procent: round(values.tips * 100 / values.totalBills),
                bills: []
            })
        }
        if(values.totalBills > 0 && values.discounts > 0){
            paymentMethods.push({
                name: 'Discount',
                value: round(values.discounts),
                procent: round(values.discounts * 100 / values.totalBills),
                bills: discountBills
            })
        }
        return paymentMethods
    }


    function createDepartaments(billProducts){
        let departaments = []
        for(let prod of billProducts){
            const price = (prod.price*prod.quantity) - prod.discount
            if(!prod.mainCat){
                prod.mainCat = 'Nedefinit'
            }
            const existingDep = departaments.find(d => d.name === prod.mainCat)
            if(existingDep) {
                const existingProduct = existingDep.products.find(p => p.name === prod.name)
                if(existingProduct){
                    existingProduct.qty = existingProduct.qty + prod.quantity
                    existingDep.total += price
                    const existingType = existingDep.dep.find(p => (p.name === prod.dep))
                    if(existingType) {
                        existingType.total = existingType.total + round(price)
                      } else {
                        existingDep.dep.push(
                          {
                            name: prod.dep,
                            total: price,
                          }
                           )
                      }
                } else {
                    const product = {
                        name: prod.name,
                        dep: prod.dep,
                        qty: prod.quantity,
                        price: prod.price - prod.discount
                      }
                      existingDep.total += round(product.price * product.qty)
                      existingDep.products.push(product)
                      const existingType = existingDep.dep.find(p => (p.name === prod.dep))
                      if(existingType) {
                        existingType.total = existingType.total + round(price)
                      } else {
                        existingDep.dep.push(
                          {
                            name: prod.dep,
                            total: price,
                          }
                          )
                      }
                }
            } else {
                const dep = {
                    total: price,
                    showType: false,
                    name: prod.mainCat,
                    dep: [
                        {
                          name: prod.dep,
                          total: price,
                        }
                      ],
                    products: [
                      {
                        name: prod.name,
                        dep: prod.dep,
                        qty: prod.quantity,
                        price: prod.price - prod.discount
                      }
                    ]
                  }
                departaments.push(dep)
            }
        }
        return departaments
    }


    function calcIncomeHours(bills){
        let hours = []
        for(let bill of bills){
            if(bill.production) {
                const hour = new Date(bill.createdAt).getHours()
                const exsitingHour = hours.find(p => (p.hour === hour))
                if(exsitingHour){
                    exsitingHour.total = round(exsitingHour.total + bill.total)
                } else {
                    const hou = {
                        hour: hour,
                        total: bill.total
                    }
                hours.push(hou)
                }
            }
        }
          hours.sort((a,b) => (a.hour - b.hour))
          return hours
    }

    function usersShow(bills){
        let users = []
        for(let bill of bills) {
            const existingUser = users.find(p => (p.name === bill.employee.fullName))
            if(existingUser){
              existingUser.total = round(existingUser.total + bill.total)
            } else {
              const user = {
                name: bill.employee.fullName,
                total: bill.total,
              }
              users.push(user)
            }
          }
        return users
    }



    // CALC VAT

    discountBills.forEach(bill => {
        const discountProcent = (bill.discount + bill.cashBack) * 100 / bill.total;
        bill.products.forEach(product => {
          if(product.quantity > 0 && +product.tva > 0 && product.quantity * product.price > product.discount){
            const productPrice = product.price * product.quantity
            const discountValue = productPrice * discountProcent / 100
          if(isFinite(discountValue)){
            const productRealPrice = productPrice - discountValue
            const tvaValue = productRealPrice * +product.tva / 100
            values.vatVal += round(tvaValue)
          }
          }
        })
      })
      fullBills.forEach(bill => {
        bill.products.forEach(product => {
          if(product.quantity > 0 && +product.tva > 0 && product.quantity * product.price > product.discount){
            const tvaValue = product.price * product.quantity * +product.tva / 100
            values.vatVal += round(tvaValue)
          }
        })
      })



    //CALC INGREDIENTS VALUE
    ingredients.forEach(ing => {
      if(ing.ing && ing.ing.tvaPrice && ing.qty){
        const ingValue = round(ing.ing.tvaPrice *ing.qty)
        values.totalIngredients += ingValue
      } else {
      }
    })

    //CALC WORK VALUE`

    workDays = pontaj.days.filter(day => {
        const dayDate = new Date(date.setUTCHours(0,0,0,0))
        const docDate = new Date(new Date(day.date).setUTCHours(0,0,0,0))
        return docDate.getTime() === dayDate.getTime()
    })
    workDays.forEach(day => {
        const docDate = new Date(new Date(day.date).setUTCHours(0,0,0,0))
        day.users.forEach(user => {
            if(user.employee){
                const inHeand = user.employee.employee.salary.inHeand
                const onPaper = user.employee.employee.salary.onPaper.salary
                const cass = (onPaper * 0.25) + (onPaper * 0.1)
                const tax = (onPaper - cass) * 0.1
                const employeerTax = onPaper * 0.0225
                const baseTax = (cass + tax + employeerTax)
                const employee = {
                    name: user.employee.employee.fullName,
                    hours: user.hours,
                    position: user.position,
                    monthHours: user.employee.employee.salary.norm,
                    baseIncome: inHeand,
                    hourIncome: inHeand / user.employee.employee.salary.norm,
                    totalIncome: user.employee.employee.salary.fix ? 0 : round((inHeand / user.employee.employee.salary.norm) * user.hours),
                    bonus: 0,
                    baseTax: baseTax,
                    taxValue: user.employee.employee.salary.fix ? 0 : round(baseTax / user.employee.employee.salary.norm * user.hours),
                    user: user.employee._id,
                }
                values.workValueTotal += employee.totalIncome
                values.taxValue += employee.taxValue
                
                dbUsers.forEach(dbUser => {
                    const dbEmployee = dbUser.employee
                    if(dbEmployee.fullName === employee.name){
                        dbEmployee.payments.forEach(pay => {
                            const payDate = new Date(new Date(pay.date).setUTCHours(0,0,0,0))
                            if(payDate.getTime() === docDate.getTime() && (pay.tip === 'Bonus vanzari' || pay.tip === 'Bonus excelenta')){
                                employee.bonus = round(employee.bonus + pay.amount)
                                values.workValueTotal += employee.bonus
                            }
                        })
                    }
                })
                const existingUser = users.find(u => u.name === employee.name)
                if(existingUser && existingUser.employee){
                    existingUser.hours += employee.hours
                    existingUser.totalIncome =  round(existingUser.totalIncome + employee.totalIncome)
                    existingUser.bonus = round(existingUser.bonus + employee.bonus)
                } else {
                    users.push(employee)
                }


            } 
        })

    })

    for(let dbUser of dbUsers){
        const dbEmployee = dbUser.employee
        if(dbEmployee.salary.fix && dbEmployee.salary.inHeand){
            const onPaper = dbEmployee.salary.onPaper.salary
            const cass = (onPaper * 0.25) + (onPaper * 0.1)
            const tax = (onPaper - cass) * 0.1
            const employeerTax = onPaper * 0.0225
            const baseTax = (cass + tax + employeerTax)
            const dbEmpl = {
                name: dbEmployee.fullName,
                hours: 0,
                position: dbEmployee.position,
                monthHours: dbEmployee.salary.norm,
                baseIncome: dbEmployee.salary.inHeand,
                hourIncome: round(dbEmployee.salary.inHeand / dbEmployee.salary.norm),
                totalIncome:  round(dbEmployee.salary.inHeand / daysNumber),
                bonus: 0,
                baseTax: baseTax,
                taxValue: round(baseTax / daysNumber),
                user: dbUser._id,
            }
            const existingUser = users.find(u => u.name === dbEmpl.name)
            if(existingUser){
                existingUser.totalIncome = round(existingUser.totalIncome + dbEmpl.totalIncome)
            } else {
                users.push(dbEmpl)
            }
            values.workValueTotal += dbEmpl.totalIncome
        }
    }

    //CALC IMPAIRMENTS
    


    for(const sheet of impSheets){
        for(let ing of sheet.ings){
            if(ing.ing.productIngredient){
                for(let ingg of ing.ing.ings){
                    const index = depProducts.findIndex(i => i.name === ingg.ing.name)
                    if(index !== -1){
                        depProducts[index].qty = round(depProducts[index].qty + ingg.qty)
                        values.totalDep += (ingg.qty * ingg.ing.tvaPrice)
                    } else {
                        const ing = {
                            qty: ingg.qty,
                            cost: round(ingg.ing.tvaPrice * ingg.qty),
                            name: ingg.ing.name
                        }
                        depProducts.push(ing)
                        values.totalDep += ing.cost
                    }
                }
            } else {
                const index = depProducts.findIndex(i => i.name === ing.ing.name)
                if(index !== -1){
                    depProducts[index].qty = round(depProducts[index].qty + ing.qty)
                    values.totalDep += (ing.qty * ing.ing.tvaPrice)
                } else {
                    const ingg = {
                        qty: ing.qty,
                        cost: round(ing.ing.tvaPrice * ing.qty),
                        name: ing.ing.name
                    }
                    depProducts.push(ingg)
                    values.totalDep += ingg.cost
                }
            }
        }
    }


    for(const prod of delProds){
        let cost = 0
        for(const ing of prod.billProduct.ings){
            if(ing.ing){
                ingredients.forEach(ings => {
                    if(ings.ing._id.toString() === ing.ing._id.toString()) {
                        values.totalDep += (ing.qty * ings.ing.tvaPrice * prod.billProduct.quantity)
                        cost = round(cost + (ing.qty * ings.ing.tvaPrice))
                    }   
                })
            
            } else {
                const existingProd = oldProd.find(obj => obj.name === prod.billProduct.name)
                if(existingProd){
                    existingProd.qty += 1
                } else {
                    oldProd.push({
                        name: prod.billProduct.name,
                        qty: 1
                    })
                }
                break
            }
        }
        if(cost > 0){
            const existingProd = depProducts.find(p => p.name === prod.billProduct.name)
            if(existingProd){
                existingProd.qty += prod.billProduct.quantity
            } else {
                const prodd = {
                    name: prod.billProduct.name,
                    cost: cost,
                    qty: prod.billProduct.quantity
                }
                depProducts.push(prodd)
            }
        }
    }

    for(const prod of oldProd){ 
        let cost = 0
        billProducts.forEach(product => {
            if(product.name === prod.name){
                for(const ing of product.ings){
                    if(ing.ing){
                        values.totalDep += (ing.qty * ing.ing.tvaPrice * prod.qty)
                        cost = round(cost + (ing.qty * ing.ing.tvaPrice))
                    }
                }
            }
        })
        if(cost > 0){
            const existingProd = depProducts.find(p => p.name === prod.name)
            if(existingProd){
                existingProd.qty += prod.qty
            } else {
                const pro = {
                    name: prod.name,
                    cost: cost,
                    qty: prod.qty
                }
                depProducts.push(pro)
            }
        }
    }

    //CALC SUPLIES

    for(const ing of allIngs){
        if(ing.uploadLog){
            for(const log of ing.uploadLog) {
                    const logDate = new Date(log.date).getTime()
                    if(startTime < logDate && logDate < endTime) {
                        switch (ing.dept.name) {
                            case 'Consumabil':                       
                                if(!log.uploadPrice){
                                    values.totalSuplies += (ing.tvaPrice * log.qty) 
                                } else {
                                    values.totalSuplies += (log.uploadPrice * log.qty) 
                                }
                                const cObject = {
                                  date: log.date,
                                  name: ing.name,
                                  price: log.uploadPrice ? log.uploadPrice * log.qty : ing.tvaPrice * log.qty,
                                  qty: log.qty,
                                  suplier: log.operation.details
                              }
                              consEntryes.push(cObject)
                              break;
                            case 'Servicii':                        
                                if(!log.uploadPrice){
                                    values.serviceValue += (ing.tvaPrice * log.qty) 
                                } else {
                                    values.serviceValue += (log.uploadPrice * log.qty) 
                                }
                                const sObject = {
                                    date: log.date,
                                    name: ing.name,
                                    price: log.uploadPrice ? log.uploadPrice * log.qty : ing.tvaPrice * log.qty,
                                    qty: log.qty,
                                    suplier: log.operation.details
                                }
                                servEntryes.push(sObject)
                              break;
                            case 'Obiecte de inventar':                 
                                if(!log.uploadPrice){
                                    values.inventarySpendings += (ing.tvaPrice * log.qty)
                                } else {
                                    values.inventarySpendings += (log.uploadPrice * log.qty)
                                }
                                const oObject = {
                                    date: log.date,
                                    name: ing.name,
                                    price: log.uploadPrice ? log.uploadPrice * log.qty : ing.tvaPrice * log.qty,
                                    qty: log.qty,
                                    suplier: log.operation.details
                                }
                                obInvEntryes.push(oObject)
                              break;
                            case 'Marketing':                    
                                if(!log.uploadPrice){
                                    values.marketingValue += (ing.tvaPrice * log.qty)
                                } else {
                                    values.marketingValue += (log.uploadPrice * log.qty)
                                }
                                const mObject = {
                                    date: log.date,
                                    name: ing.name,
                                    price: log.uploadPrice ? log.uploadPrice * log.qty : ing.tvaPrice * log.qty,
                                    qty: log.qty,
                                    suplier: log.operation.details
                                }
                                marketingEntryes.push(mObject)
                              break;
                            case 'Amenajări':                
                                if(!log.uploadPrice){
                                    values.constructionsValue += (ing.tvaPrice * log.qty)
                                } else {
                                    values.constructionsValue += (log.uploadPrice * log.qty)
                                }
                                const aObject = {
                                    date: log.date,
                                    name: ing.name,
                                    price: log.uploadPrice ? log.uploadPrice * log.qty : ing.tvaPrice * log.qty,
                                    qty: log.qty,
                                    suplier: log.operation.details
                                }
                                amenajariEntryes.push(aObject)
                              break;
                            case 'Combustibil':                  
                                if(!log.uploadPrice){
                                    values.gasValue += (ing.tvaPrice * log.qty)
                                } else {
                                    values.gasValue += (log.uploadPrice * log.qty)
                                }
                                const bObject = {
                                    date: log.date,
                                    name: ing.name,
                                    price: log.uploadPrice ? log.uploadPrice * log.qty : ing.tvaPrice * log.qty,
                                    qty: log.qty,
                                    suplier: log.operation.details
                                }
                                combsEntryes.push(bObject)
                              break;
                            case 'Chirie':             
                                if(!log.uploadPrice){
                                    values.rentValue += (ing.tvaPrice * log.qty)
                                } else {
                                    values.rentValue += (log.uploadPrice * log.qty)
                                }
                                const rObject = {
                                    date: log.date,
                                    name: ing.name,
                                    price: log.uploadPrice ? log.uploadPrice * log.qty : ing.tvaPrice * log.qty,
                                    qty: log.qty,
                                    suplier: log.operation.details
                                }
                                rentEntryes.push(rObject)
                              break;
                            case 'Utilități':        
                                if(!log.uploadPrice){
                                    values.utilitiesValue += (ing.tvaPrice * log.qty)
                                } else {
                                    values.utilitiesValue += (log.uploadPrice * log.qty)
                                }
                                const uObject = {
                                    date: log.date,
                                    name: ing.name,
                                    price: log.uploadPrice ? log.uploadPrice * log.qty : ing.tvaPrice * log.qty,
                                    qty: log.qty,
                                    suplier: log.operation.details
                                }
                                utilitiesEntryes.push(uObject)
                            case 'Materie Primă':
                                    if(ing.gestiune === 'Bucătărie'){
                                        if(!log.uploadPrice){
                                            values.inIngsProdBuc += (ing.tvaPrice * log.qty)
                                        } else {
                                            values.inIngsProdBuc += (log.uploadPrice * log.qty)
                                        }
                                    }
                                    if(ing.gestiune === 'Bar'){
                                        if(!log.uploadPrice){
                                        values.inIngsProdBar += (ing.tvaPrice * log.qty)
                                    } else {
                                        values.inIngsProdBar += (log.uploadPrice * log.qty)
                                    }
                                    }
                                break
                            case 'Marfă': 
                                    if(ing.gestiune === 'Bucătărie'){
                                        if(!log.uploadPrice){
                                            values.inIngsMfBuc += (ing.tvaPrice * log.qty)
                                        } else {
                                            values.inIngsMfBuc += (log.uploadPrice * log.qty)
                                        }
                                    }
                                    if(ing.gestiune === 'Bar'){
                                        if(!log.uploadPrice){
                                        values.inIngsMfBar += (ing.tvaPrice * log.qty)
                                    } else {
                                        values.inIngsMfBar += (log.uploadPrice * log.qty)
                                    }
                                    }
                                break
                            default:                    
                                console.log('default' ,ing.dep)
                                    
                                 
                        }
                                 
                } 
            }
        } 
    }

    const report = new Report({
        locatie: loc,
        day: startTime,
        cashIn: round(values.totalBills),
        vatValue: round(values.vatVal),
        cashInNoVat: round(values.totalBills - values.vatVal),
        ingsValue: round(values.totalIngredients),
        rentValue: round(values.dayRent),
        diverse: {
            total: round(values.diverse),
            entry: entryy
        },
        impairment: {
            total: round(values.totalDep),
            products: depProducts,
        },
        workValue: {
            total: round(values.workValueTotal),
            tax: round(values.taxValue),
            users: users
        },
        supliesValue: { 
            total: round(values.totalSuplies),
            entries: consEntryes
        }, 
        supliesProdBuc: round(values.inIngsProdBuc),
        supliesMfBuc: round(values.inIngsMfBuc),
        supliesProdBar: round(values.inIngsProdBar),
        supliesMfBar: round(values.inIngsMfBar),

        serviceValue: {
            total: round(values.serviceValue),
            entries: servEntryes
        },
        marketingValue: {
            total: round(values.marketingValue),
            entries: marketingEntryes
        },
        inventarySpendings: {
            total: round(values.inventarySpendings),
            entries: obInvEntryes
        },
        gasValue: {
            total: round(values.gasValue),
            entries: combsEntryes
        },
        constructionsValue: {
            total: round(values.constructionsValue),
            entries: amenajariEntryes
        },
        rent: {
            total: round(values.rentValue),
            entries: rentEntryes
        },
        utilities: {
            total: round(values.utilitiesValue),
            entries: utilitiesEntryes
        },
        departaments: createDepartaments(billProducts),
        hours: calcIncomeHours(bills),
        users: usersShow(bills),
        paymentMethods: createPaymentMethods(values),
    })
    const newRep = await report.save()
    // console.log(values)

    return newRep
}













function getDaysInMonthFromDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }


  function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    const sortedArr1 = arr1.slice().sort();
    const sortedArr2 = arr2.slice().sort();
  
    for (let i = 0; i < sortedArr1.length; i++) {
        const obj1 = sortedArr1[i];
        const obj2 = sortedArr2[i];
  
        if (!objectsAreEqual(obj1, obj2)) {
            return false;
        }
    }
    return true;
  }


 function objectsAreEqual(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }





  module.exports = {getIngredients, getBillProducts, createDayReport}