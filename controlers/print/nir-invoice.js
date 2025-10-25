const PDFDocument = require("pdfkit");

const {round} = require('../../utils/functions')

function createNirInvoice(invoice, value = 0){

  let doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
});

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

doc.font("public/font/Montserrat-Regular.ttf");
doc.text(`C.I.F.`, 25 + 10, 50, { width: 30, align: "left" });
doc.text(`Banca`, 25 + 10, 72, { width: 50, align: "left" })
doc.text(`Cont:`, 25 + 10, 90, { width: 50, align: "left" })

//date firma

doc.fontSize(10);
// doc.font('Courier')


doc.text(`${invoice.supplier.bank}`, 60 + 10, 72)
doc.font('public/font/Montserrat-Bold.ttf')
doc.text(`${invoice.supplier.vatNumber}`, 68, 50);
doc.text(`${invoice.supplier.iban}`, 55 + 10, 90)

//HEADER CLIENT
//Nume client
doc.fontSize(10)

doc.fontSize(12);
doc.font('public/font/Montserrat-Bold.ttf')

let rh = 2

// header date client
doc.fontSize(10);
// doc.font('Courier-Bold')
doc.text('Client', 395 - 40, 50, { width: 35, align: "left" })
doc.text(`C.I.F.`, 395 - 40, 62 +rh, { width: 30, align: "left" });




//date client
doc.fontSize(10);
// doc.font('public/font/Montserrat-Bold.ttf')
doc.text(`${invoice.locatie.bussinessName}`, 485 - 60, 50, { width: 150, align: "left" });
doc.font("public/font/Montserrat-Regular.ttf");
doc.text(`${invoice.locatie.vatNumber}`, 485  - 40, 62+rh , { width: 145, align: "left" });


//Titlu factura

doc.roundedRect(200, 120, 180, 54, 1)
doc.lineWidth(0.8);
doc.stroke()
// doc.font('Courier')
doc.fontSize(24)
doc.font('public/font/Montserrat-Bold.ttf')
doc.text('FACTURĂ', 218, 90)
doc.fontSize(8)
doc.font("public/font/Montserrat-Regular.ttf");
doc.text('Serie/Nr.', 230, 92 + 35, { width: 40, align: "left" })
doc.text('Emisă', 230, 107 + 35, { width: 40, align: "left" })
doc.text('Scadentă', 230, 122 + 35, { width: 40, align: "left" })

// Titlu Factura Date
doc.font('public/font/Montserrat-Bold.ttf')
doc.fontSize(9)
doc.text(`${invoice.invoiceNumber}`, 275, 90 + 35)
doc.text(`${invoice.issueDate}`, 275, 105 + 35)
doc.text(`${invoice.dueDate}`, 275, 120 + 35)


let rectStartH = 227
let rectHeigth = 330
let headerHeight = 180
// radare produse
y = 317
let heghtValue = 12
// doc.font("Courier");
doc.fontSize(9)
let productsCount = invoice.products.length
let rowHeigth = 12

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
//   rowHeigth = 5
// }
// if(productsCount > 60){
//   rectHeigth
// }


 

let ingChunks = splitIngredients(invoice.products)


let pages = ingChunks.length

let pageCount = ingChunks.length
if(ingChunks[ingChunks.length -1].length > 30 || (ingChunks[ingChunks.length -1].length > 24) && ingChunks.length === 1 ) {
    pageCount = pageCount + 1
}

ingChunks.forEach((ch, i) => {
    doc = addIngredients(doc, ch, rowHeigth, y, i+1, headerHeight, rectHeigth, rectStartH, heghtValue, pages, invoice.taxExclusiveAmount, invoice.taxInclusiveAmount, invoice.vatAmount, pageCount, value)
})



return doc

}



function addIngredients(doc, ch, rowHeigth, y, page, headerHeight, rectHeigth, rectStartH, heghtValue, pageLenght, taxExclusiveAmount, taxInclusiveAmount, vatAmount, pageCount, value){
     doc.fillColor('black') 
  if(page !== 1) {
      y = y - 160
      headerHeight = headerHeight - 160
      rectStartH = rectStartH - 160
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
        doc.text(`${i + 1}`, 26, newValue, { width: 17, align: "center" })
        doc.text(`${el.name}`, 47, newValue, { width: 225, align: 'left' })
        doc.text(`Buc`, 274, newValue, { width: 28, align: "center" })
        doc.text(`${el.quantity}.00`, 304, newValue, { width: 58, align: "center" })
        doc.text(`${round(el.totalNoVat/el.quantity)}`, 364, newValue, { width: 58, align: "center" })
        doc.text(`${round(el.totalNoVat)}`, 424, newValue, { width: 58, align: "center" })
        doc.text(`${el.vatPrecent}%`, 486, newValue, { width: 35, align: "left" })
        doc.text(`${round((el.price * el.quantity) * (el.vatPrecent / 100))}`, 498, newValue, { width: 60, align: "right" })
        if(value === el.totalNoVat){
          doc.lineWidth(0.2);
          doc.strokeColor('red');
          doc.moveTo(26, newValue + rowHeigth -1).lineTo(272, newValue + rowHeigth -1).stroke();
          doc.strokeColor('black');
        }
        heghtValue += rowHeigth
    })
    let pageWidth = doc.page.width;
    let pageHeight = doc.page.height;

    console.log(page)
    console.log(pageLenght)

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

  }


  return doc
}



function splitIngredients(arr, firstChunkSize = 26, otherChunkSize = 24) {
  const result = [];

  // First chunk
  result.push(arr.slice(0, firstChunkSize));

  // Remaining chunks
  for (let i = firstChunkSize; i < arr.length; i += otherChunkSize) {
    result.push(arr.slice(i, i + otherChunkSize));
  }

  return result;
}



module.exports = {createNirInvoice}