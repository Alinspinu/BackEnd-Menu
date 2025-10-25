const PDFDocument = require("pdfkit");

const {round} = require('../../utils/functions')

function createInfoice(invoice){

  let doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
});
if(invoice.discount.length){
  const discounts = invoice.discount
  discounts.forEach(d => {
    invoice.products.push({
      name: d.reason + ' ' + d.precent * 100 + '%',
      quantity: 1,
      unitCode: 'Buc',
      price: d.value,
      totalNoVat: d.value,
      total: round(d.value * (1 + ( d.vat / 100 ) )),
      vatPrecent: d.vat
    })
  })
}


//HEADER FURNIZOR

//Nume furnizor
doc.fontSize(10)
doc.font('public/font/Montserrat-Regular.ttf')
doc.text('Furnizor', 25 + 10, 10)
doc.fontSize(18);
doc.font('public/font/Montserrat-Bold.ttf')
doc.text(`${invoice.supplier.name}`, 25 + 10, 25);
doc.lineWidth(1.3);
doc.moveTo(25 + 10, 45).lineTo(560, 45).stroke();

//header date firma
doc.fontSize(10);
doc.text(`C.I.F.`, 25 + 10, 50, { width: 30, align: "left" });
doc.text(`Nr. Reg. Com.`, 25 + 10, 62, { width: 100, align: "left" });
doc.text(`Capital social`, 25 + 10, 74, { width: 100, align: "left" });
doc.text(`Adresa`, 25 + 10, 86, { width: 38, align: "left" })
doc.font("public/font/Montserrat-Regular.ttf");
doc.text(`Email`, 25 + 10, 110, { width: 50, align: "left" })
doc.text(`Banca`, 25 + 10, 122, { width: 50, align: "left" })
doc.text(`Cont`, 25 + 10, 134, { width: 50, align: "left" })

//date firma

doc.fontSize(10);
// doc.font('Courier')
doc.text(`${invoice.supplier.vatNumber}`, 130 + 10, 50);
doc.text(`${invoice.supplier.registration}`, 130 + 10, 62);
doc.text(`200 lei`, 130 + 10, 74);
// doc.font("Courier");
doc.text(`${invoice.supplier.address.city.toUpperCase()}, Strada ${invoice.supplier.address.street}`, 25 + 10, 86 + 12, { width: 220, align: "left" })

doc.text(`${invoice.supplier.contact.email}`, 60 + 10, 110)
doc.text(`${invoice.supplier.bank}`, 60 + 10, 122)
doc.text(`${invoice.supplier.iban}`, 55 + 10, 134)

//HEADER CLIENT
//Nume client
doc.fontSize(10)

doc.fontSize(12);
doc.font('public/font/Montserrat-Bold.ttf')

let rh = 2
if(invoice.client.name.split('').length > 22) rh = 12
if(invoice.client.name.split('').length > 44) rh = 24
// header date client
doc.fontSize(10);
// doc.font('Courier-Bold')
doc.text('Client', 395 - 40, 50, { width: 35, align: "left" })
doc.text(`C.I.F.`, 395 - 40, 62 +rh, { width: 30, align: "left" });
doc.text(`Nr. Reg. Com.`, 395 - 40, 74 +rh, { width: 90, align: "left" });
doc.text(`Adresa`, 395 - 40, 86 +rh, { width: 40, align: "left" })



//date client
doc.fontSize(10);
// doc.font('public/font/Montserrat-Bold.ttf')
doc.text(`${invoice.client.name}`, 485 - 60, 50, { width: 150, align: "left" });
doc.font("public/font/Montserrat-Regular.ttf");
doc.text(`${invoice.client.vatNumber}`, 485  - 40, 62+rh , { width: 145, align: "left" });
doc.text(`${invoice.client.registration}`, 485  - 40, 74 + rh , { width: 105, align: "left" });
// doc.font("Courier");
doc.text(`${invoice.client.address.city.toUpperCase()}, Strada ${invoice.client.address.street}`, 395 - 40, 98+rh, { width: 215, align: "left" })



//Titlu factura

doc.roundedRect(210, 170, 150, 54, 1)
doc.lineWidth(0.8);
doc.stroke()
// doc.font('Courier')
doc.fontSize(24)
doc.font('public/font/Montserrat-Bold.ttf')
doc.text('FACTURĂ', 228, 140)
doc.fontSize(8)
doc.font("public/font/Montserrat-Regular.ttf");
doc.text('Serie/Nr.', 230, 162 + 15, { width: 40, align: "left" })
doc.text('Emisă', 230, 177 + 15, { width: 40, align: "left" })
doc.text('Scadentă', 230, 192 + 15, { width: 40, align: "left" })

// Titlu Factura Date
doc.font('public/font/Montserrat-Bold.ttf')
doc.fontSize(9)
doc.text(`${invoice.invoiceNumber}`, 275, 160 + 15)
doc.text(`${invoice.issueDate}`, 275, 175 + 15)
doc.text(`${invoice.dueDate}`, 275, 190 + 15)



let rectStartH = 247
let rectHeigth = 650
let headerHeight = 200
// radare produse
y = 237
let heghtValue = 12

// doc.font("Courier");
doc.fontSize(9)
let productsCount = invoice.products.length
let rowHeigth = 12

let firstChunk = 0
let restChunks = 0

if(productsCount <= 28){
  firstChunk = 28
}

if(productsCount > 28){
  firstChunk = 41
  restChunks = 54
}



 

let ingChunks = splitIngredients(invoice.products, firstChunk, restChunks)


let pages = ingChunks.length

let pageCount = ingChunks.length
if(ingChunks[ingChunks.length -1].length > firstChunk || (ingChunks[ingChunks.length -1].length > restChunks) && ingChunks.length === 1 ) {
    pageCount = pageCount + 1
}

ingChunks.forEach((ch, i) => {
    doc = addIngredients(doc, ch, rowHeigth, y, i+1, headerHeight, rectHeigth, rectStartH, heghtValue, pages, invoice.taxExclusiveAmount, invoice.taxInclusiveAmount, invoice.vatAmount, pageCount)
})

//header produsex
// doc.rect(25, 280, 18, 30)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.font("public/font/Montserrat-Regular.ttf");
// doc.fontSize(9)
// doc.text('Nr.', 26, 281)
// doc.text('crt.', 26, 296)

// doc.rect(43, 280, 230, 30)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('Denumirea produselor si serviciilor', 44, 293, { width: 228, align: "center" })

// doc.rect(273, 280, 30, 30)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('U.M.', 275, 293, { width: 28, align: "center" })

// doc.rect(303, 280, 60, 30)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('Cantitate', 305, 293, { width: 58, align: "center" })

// doc.rect(363, 280, 60, 30)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('Pret unitar', 365, 287, { width: 58, align: "center" })
// doc.text('fara T.V.A.', 365, 299, { width: 58, align: "center" })

// doc.rect(423, 280, 60, 30)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('Valoare', 425, 287, { width: 58, align: "center" })
// doc.text('fara T.V.A.', 425, 299, { width: 58, align: "center" })

// doc.rect(483, 280, 77, 30)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('T.V.A.', 485, 285, { width: 75, align: "center" })
// doc.text('Cota', 485, 299, { width: 35, align: "left" })
// doc.text('Valoare', 521, 299, { width: 38, align: "right" })

// //little header
// doc.rect(25, 311, 18, 15)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('0', 26, 315, { width: 17, align: "center" })

// doc.rect(43, 311, 230, 15)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('1', 44, 315, { width: 228, align: "center" })

// doc.rect(273, 311, 30, 15)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('2', 274, 315, { width: 28, align: "center" })

// doc.rect(303, 311, 60, 15)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('3', 304, 315, { width: 58, align: "center" })

// doc.rect(363, 311, 60, 15)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('4', 364, 315, { width: 58, align: "center" })

// doc.rect(423, 311, 60, 15)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('5 = 3 x 4', 424, 315, { width: 58, align: "center" })

// doc.rect(483, 311, 77, 15)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.text('6', 484, 315, { width: 75, align: "center" })


// //Body produse
// doc.rect(25, 327, 18, 330)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.rect(43, 327, 230, 330)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.rect(273, 327, 30, 330)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.rect(303, 327, 60, 330)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.rect(363, 327, 60, 330)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.rect(423, 327, 60, 330)
// doc.lineWidth(0.5);
// doc.stroke()

// doc.rect(483, 327, 77, 330)
// doc.lineWidth(0.5);
// doc.stroke()

// let products = []

// for(let p of invoice.products){
//   const existingProduct = products.find(pa => pa.name === p.name)
//   if(existingProduct){
//     existingProduct.quantity += p.quantity
//     existingProduct.totalNoVat += p.totalNoVat
//     existingProduct.total += p.total
//   } else {
//     products.push(p)
//   }
// }

// invoice.products = products




// // radare produse
// y = 317
// let heghtValue = 12
// // doc.font("Courier");
// doc.fontSize(9)
// const productsCount = invoice.products.length
// let rowHeigth = 14

// if(productsCount >= 25 && productsCount <= 40){
//   doc.fontSize(8)
//   rowHeigth = 10
// }
// if(productsCount >= 41 && productsCount <= 50){
//   doc.fontSize(6)
//   rowHeigth = 8
// }
// if(productsCount > 50){
//   doc.fontSize(5)
//   rowHeigth = 7
// }




// invoice.products.forEach((el, i) => {
//   if(el.name.length > 30){
//     el.name = el.name.slice(0, 40)
//   }
//     let newValue = y + heghtValue
//     doc.text(`${i + 1}`, 26, newValue, { width: 17, align: "center" })
//     doc.text(`${el.name}`, 47, newValue, { width: 225, align: 'left' })
//     doc.text(`Buc`, 274, newValue, { width: 28, align: "center" })
//     doc.text(`${el.quantity}.00`, 304, newValue, { width: 58, align: "center" })
//     doc.text(`${round(el.totalNoVat/el.quantity)}`, 364, newValue, { width: 58, align: "center" })
//     doc.text(`${round(el.totalNoVat)}`, 424, newValue, { width: 58, align: "center" })
//     doc.text(`${el.vatPrecent}%`, 486, newValue, { width: 35, align: "left" })
//     doc.text(`${round(el.total - el.totalNoVat)}`, 496, newValue, { width: 60, align: "right" })
//     heghtValue += rowHeigth
// })

// doc.fontSize(10)
// //footer factura
// doc.rect(25, 669, 338, 105)
// doc.lineWidth(0.5);
// doc.stroke()
// doc.image('public/icons/logo-stanga.png', 35, 689, {width: 300})

// doc.rect(363, 669, 197, 105)
// doc.lineWidth(0.5);
// doc.stroke()
// doc.fontSize(7)
// doc.text('(Total fără T.V.A.)', 380, 692, { width: 60, align: 'center' })
// doc.text('(Total T.V.A.)', 488, 692, { width: 60, align: 'center' })
// doc.font('public/font/Montserrat-Bold.ttf')
// doc.fontSize(12)
// doc.text(`${round(invoice.taxExclusiveAmount)} Lei`, 365, 678, { width: 90, align: 'center' })
// doc.text(`${round(invoice.vatAmount)} Lei`, 480, 678, { width: 75, align: 'center' })

// doc.fontSize(16)
// doc.text('TOTAL', 382, 745)
// doc.text(`${round(invoice.taxInclusiveAmount)} Lei`, 445, 745,{ width: 150, align: 'left' })

return doc

}


function addIngredients(doc, ch, rowHeigth, y, page, headerHeight, rectHeigth, rectStartH, heghtValue, pageLenght, taxExclusiveAmount, taxInclusiveAmount, vatAmount, pageCount){
  doc.fillColor('black') 


  if(page !== 1) {
     y = y - 160
     headerHeight = headerHeight - 160
     rectStartH = rectStartH - 160
   }  else {
     rectHeigth = rectHeigth - 150
  }
  let index = 1
  if(page === 2) index = 1 + 41
  if(page === 3) index = 41 + 54
  if(page === 4) index = 41 + 54 + 54
  if(page === 5) index = 41 + 54 + 54 + 54


 if(page === pageLenght){
   rectHeigth = rectHeigth - 80
 }

 //header produsex
 doc.rect(25, headerHeight, 18, 30)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.font("public/font/Montserrat-Regular.ttf");
 doc.fontSize(9)
 doc.text('Nr.', 26, headerHeight + 1)
 doc.text('crt.', 26, headerHeight + 16)

 doc.rect(43, headerHeight, 230, 30)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('Denumirea produselor si serviciilor', 44, headerHeight + 13, { width: 228, align: "center" })

 doc.rect(273, headerHeight, 30, 30)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('U.M.', 275, headerHeight + 13, { width: 28, align: "center" })

 doc.rect(303, headerHeight, 60, 30)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('Cantitate', 305, headerHeight + 13, { width: 58, align: "center" })

 doc.rect(363, headerHeight, 60, 30)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('Pret unitar', 365, headerHeight + 7, { width: 58, align: "center" })
 doc.text('fara T.V.A.', 365, headerHeight + 19, { width: 58, align: "center" })

 doc.rect(423, headerHeight, 60, 30)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('Valoare', 425, headerHeight + 7, { width: 58, align: "center" })
 doc.text('fara T.V.A.', 425, headerHeight + 19, { width: 58, align: "center" })

 doc.rect(483, headerHeight, 77, 30)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('T.V.A.', 485, headerHeight + 5, { width: 75, align: "center" })
 doc.text('Cota', 485, headerHeight + 19, { width: 35, align: "left" })
 doc.text('Valoare', 521, headerHeight + 19, { width: 38, align: "right" })

 //little header
 doc.rect(25, headerHeight + 31, 18, 15)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('0', 26, headerHeight + 35, { width: 17, align: "center" })

 doc.rect(43, headerHeight + 31, 230, 15)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('1', 44, headerHeight + 35, { width: 228, align: "center" })

 doc.rect(273, headerHeight + 31, 30, 15)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('2', 274, headerHeight + 35, { width: 28, align: "center" })

 doc.rect(303, headerHeight + 31, 60, 15)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('3', 304, headerHeight + 35, { width: 58, align: "center" })

 doc.rect(363, headerHeight + 31, 60, 15)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('4', 364, headerHeight + 35, { width: 58, align: "center" })

 doc.rect(423, headerHeight + 31, 60, 15)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('5 = 3 x 4', 424, headerHeight + 35, { width: 58, align: "center" })

 doc.rect(483, headerHeight + 31, 77, 15)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.text('6', 484, headerHeight + 35, { width: 75, align: "center" })





 //Body produse
 doc.rect(25, rectStartH, 18, rectHeigth)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.rect(43, rectStartH, 230, rectHeigth)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.rect(273, rectStartH, 30, rectHeigth)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.rect(303, rectStartH, 60, rectHeigth)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.rect(363, rectStartH, 60, rectHeigth)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.rect(423, rectStartH, 60, rectHeigth)
 doc.lineWidth(0.5);
 doc.stroke()

 doc.rect(483, rectStartH, 77, rectHeigth)
 doc.lineWidth(0.5);
 doc.stroke()






 // doc.fontSize(8)
 ch.forEach((el, i) => {
     let newValue = y + heghtValue
     doc.text(`${i + index}`, 26, newValue, { width: 17, align: "center" })
     doc.text(`${el.name}`, 47, newValue, { width: 225, align: 'left' })
     doc.text(`Buc`, 274, newValue, { width: 28, align: "center" })
     doc.text(`${el.quantity}.00`, 304, newValue, { width: 58, align: "center" })
     doc.text(`${round(el.totalNoVat/el.quantity)}`, 364, newValue, { width: 58, align: "center" })
     doc.text(`${round(el.totalNoVat)}`, 424, newValue, { width: 58, align: "center" })
     doc.text(`${el.vatPrecent}%`, 486, newValue, { width: 35, align: "left" })
     doc.text(`${round((el.price * el.quantity) * (el.vatPrecent / 100))}`, 498, newValue, { width: 60, align: "right" })
     heghtValue += rowHeigth
 })
 let pageWidth = doc.page.width;
 let pageHeight = doc.page.height;


 if(page < pageLenght){
   doc.fontSize(7)
     .fillColor('gray')
     .text(`Pagina ${page} din ${pageCount}`, pageWidth / 2 - 40, pageHeight - 90);
   doc.addPage()
} else { 

 doc.fontSize(10)
 //footer factura
 doc.rect(25, 669, 338, 105)
 doc.lineWidth(0.5);
 doc.stroke()
 // doc.image('public/icons/logo-stanga.png', 35, 689, {width: 300})

 doc.rect(363, 669, 197, 105)
 doc.lineWidth(0.5);
 doc.stroke()
 doc.fontSize(7)
 doc.text('(Total fără T.V.A.)', 380, 692, { width: 60, align: 'center' })
 doc.text('(Total T.V.A.)', 488, 692, { width: 60, align: 'center' })
 doc.font('public/font/Montserrat-Bold.ttf')
 doc.fontSize(12)
 doc.text(`${round(taxExclusiveAmount)} Lei`, 365, 678, { width: 90, align: 'center' })
 doc.text(`${round(vatAmount)} Lei`, 480, 678, { width: 75, align: 'center' })

 doc.fontSize(16)
 doc.text('TOTAL', 382, 745)
 doc.text(`${round(taxInclusiveAmount)} Lei`, 445, 745,{ width: 150, align: 'left' })

 if(page !== 1){
   doc.font("public/font/Montserrat-Regular.ttf");
   doc.fontSize(7)
   .fillColor('gray')
   .text(`Pagina ${page} din ${pageCount}`, pageWidth / 2 - 40, 658);
 }
}


return doc
}







function splitIngredients(arr, firstChunkSize = 30, otherChunkSize = 24) {
  const result = [];

  // First chunk
  result.push(arr.slice(0, firstChunkSize));

  // Remaining chunks
  for (let i = firstChunkSize; i < arr.length; i += otherChunkSize) {
    result.push(arr.slice(i, i + otherChunkSize));
  }

  return result;
}

module.exports = {createInfoice}