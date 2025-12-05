const ExcelJS = require("exceljs");
const Locatie = require('../../models/office/locatie')
const {formatedDateToShow, round} = require('../../utils/functions')


async function createProductsReportXcelBuffer(products, salePoint, date){
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Raport produse vandute`);
  const docTitle =  [
      `${salePoint.locatie.bussinessName}`,'',`Raport produse vandute din ${date} `]
  worksheet.addRow(docTitle)
  worksheet.addRow([`${salePoint.name}`], '')
  worksheet.addRow([])
 const head = worksheet.addRow([
    'Nr',
    'Nume produs',
    'Cota tva',
    'Cost UM cu tva',
    'Cost UM fara tva',
    'Pret UM cu tva',
    'Pret UM fara tva',
    'Cantitate vanduta',
    'Cost total cu tva',
    'Cost total fara tva',
    'Vanzare totala cu tva',
    'Vanzare totala fara tva',
    'Discount cu tva',
    'Discount fara tva',
    'Incasat cu tva',
    'Incasat fara tva',
  ])

  head.eachCell((cell) => {
    cell.font = {
        bold: true,
        size: 13
    }
  })

  let costTotalVat = 0
  let costTotalNoVat = 0
  let saleTotalVat = 0
  let saleTotalNoVat = 0
  let discountTotalVat = 0
  let discountTotalNoVat = 0
  let cashInTotalVat = 0
  let cashInTotalNoVat = 0
  let totalQty = 0

  const sortedProducts = products.sort((a, b) => a.name.localeCompare(b))

  sortedProducts.forEach((p, i) => {
    totalQty += p.quantity
    const costUmVat =  calcProductionValue(p.toppings, p.ings, 1)
    const costUmNoVat = calcProductionValueNoVat(p.toppings, p.ings, 1)
    const priceNoVat = round(p.price / (1+ (p.tva/100)))
    const costVat = round(p.quantity * costUmVat)
    costTotalVat += costVat
    const costNoVat = round(p.quantity * costUmNoVat)
    costTotalNoVat += costNoVat
    const saleVat = round(p.price * p.quantity)
    saleTotalVat += saleVat
    const saleNoVat = round(saleVat / (1 + (p.tva/100)))
    saleTotalNoVat += saleNoVat
    const discountNoVat = round(p.discount / (1 + (p.tva/100))) || 0
    discountTotalNoVat += discountNoVat
    discountTotalVat += p.discount
    
    const cashInWithVat = round(saleVat - p.discount)
    cashInTotalVat += cashInWithVat
    const cashInNoVat = round(saleNoVat - discountNoVat)
    cashInTotalNoVat += cashInNoVat
    worksheet.addRow(
        [
            i+1,
            `${p.name}`,
            p.tva,
            costUmVat,
            costUmNoVat,
            p.price,
            priceNoVat,
            p.quantity,
            costVat,
            costNoVat,
            saleVat,
            saleNoVat,
            p.discount,
            discountNoVat,
            cashInWithVat,
            cashInNoVat
        ]
    )
  })

  const totals = worksheet.addRow(
    [   
        '',
        'TOTLURI',
        '',
        '',
        '',
        '',
        '',
        totalQty,
        round(costTotalVat),
        round(costTotalNoVat),
        round(saleTotalVat),
        round(saleTotalNoVat),
        round(discountTotalVat),
        round(discountTotalNoVat),
        round(cashInTotalVat),
        round(cashInTotalNoVat)
    ]
  )

  totals.eachCell((cell) => {
    cell.font = {
        bold: true,
        size: 13
    }
  })



  worksheet.getColumn(1).width = 4;
  worksheet.getColumn(2).width = 25; 
  worksheet.getColumn(3).width = 8; 
  worksheet.getColumn(4).width = 17; 
  worksheet.getColumn(5).width = 17; 
  worksheet.getColumn(6).width = 17; 
  worksheet.getColumn(7).width = 17; 
  worksheet.getColumn(8).width = 17; 
  worksheet.getColumn(9).width = 17; 
  worksheet.getColumn(10).width = 17; 
  worksheet.getColumn(11).width = 17; 
  worksheet.getColumn(12).width = 17; 
  worksheet.getColumn(13).width = 18; 
  worksheet.getColumn(14).width = 18; 
  worksheet.getColumn(15).width = 18; 
  worksheet.getColumn(16).width = 18; 






  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}




function calcProductionValue(toppings, ings, qty, name = ''){
  // console.log(ings)
  let total = 0
  let toppingsTotal = 0
  for(let ing of ings){
    if(ing.ing) {
      if(typeof ing.ing.tvaPrice !== 'number'){
        console.log(ing)
       }
       const tvaPrice = ing.ing.price * (1 + (ing.ing.tva / 100))
      total = round(total + ((ing.qty * tvaPrice) * qty))
      for(let ingg of toppings){
        const tvaPrice = ingg.ing.price * (1 + (ingg.ing.tva / 100))
        toppingsTotal = round(toppingsTotal + (ingg.qty * tvaPrice))
      }
    } else {
      console.log(ing)
    }
  }
  return round(total + toppingsTotal - vegyDif(toppings, ings))
}

function calcProductionValueNoVat(toppings, ings, qty ){
  // console.log(ings)
  let total = 0
  let toppingsTotal = 0
  for(let ing of ings){
    if(ing.ing) {
      if(typeof ing.ing.price !== 'number'){
        console.log(ing)
       }
      total = round(total + ((ing.qty * ing.ing.price) * qty))
      for(let ingg of toppings){
        toppingsTotal = round(toppingsTotal + (ingg.qty * ingg.ing.price))
      }
    } else {
      console.log(ing)
    }
  }
  return round(total + toppingsTotal - vegyDif(toppings, ings))
}


 function vegyDif(toppings, ings ){
  for(let ing of ings){
    if(!ing.ing){
      console.log(ing)
    }
  }
    let total = 0
    const vegetal = toppings.find(t => (t.ing?.name === 'Lapte Vegetal' || t.ing?.name === 'lapte ovaz' || t.ing?.name === 'lapte mazare'))
    if(vegetal){
      const lapte = ings.find(i => i.ing?.name === 'Lapte' || i.ing?.name === 'Lapte barista 3.7% MP')
      if(lapte){
        total = round(vegetal.qty * lapte.ing.tvaPrice)
      }
    }
    return round(total)
  }



module.exports = {createProductsReportXcelBuffer}