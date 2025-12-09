const PDFDocument = require("pdfkit");

const {round} = require('../../utils/functions');

function createNirInvoice(invoice, doc, value = 0){


//HEADER FURNIZOR

//Nume furnizor
doc.fontSize(10)
doc.font('public/font/Montserrat-Regular.ttf')
doc.text('Furnizor', 25 + 10, 10)
doc.fontSize(18);
if(invoice.supplier.name.length > 45) doc.fontSize(11)
doc.font('public/font/Montserrat-Bold.ttf')
doc.text(`${invoice.supplier.name}`, 25 + 10, 25);
doc.lineWidth(1.3);
doc.moveTo(25 + 10, 45).lineTo(560, 45).stroke();

//header date firma
doc.fontSize(10);

doc.font("public/font/Montserrat-Bold.ttf");
doc.text(`C.I.F.`, 25 + 10, 50, { width: 50, align: "left" });
doc.text(`Nr Reg.`, 25+ 10, 64, { width: 50, align: "left" });
doc.text(`Banca`, 25 + 10, 72 + 6, { width: 50, align: "left" })
doc.text(`Cont:`, 25 + 10, 90 + 3, { width: 50, align: "left" })

//date firma

doc.fontSize(10);
// doc.font('Courier')


doc.font('public/font/Montserrat-Regular.ttf')
doc.text(`${invoice.supplier.vatNumber}`, 85, 50);
doc.text(`${invoice.supplier.registration}`, 85, 64);
doc.text(`${invoice.supplier.bank}`, 85, 72 +6)
doc.text(`${invoice.supplier.iban}`, 85, 90 +3)

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
doc.text(`Nr Reg.`, 395 - 40, 74 +rh, { width: 40, align: "left" });
doc.text(`Banca`, 395 - 40, 82 + rh + 4, { width: 35, align: "left" })
doc.text(`Cont:`, 395 - 40, 100 + rh + 1, { width: 30, align: "left" })




//date client
doc.fontSize(10);
// doc.font('public/font/Montserrat-Bold.ttf')
doc.text(`${invoice.locatie.bussinessName}`, 395 +5, 50, { width: 150, align: "left" });
doc.font("public/font/Montserrat-Regular.ttf");
doc.text(`${invoice.locatie.vatNumber}`, 395 + 5 , 62+rh , { width: 145, align: "left" });
doc.text(`${invoice.locatie.register}`, 395 +5 , 74+rh , { width: 145, align: "left" });
doc.text(`${invoice.locatie.bank}`, 395 + 5, 82+rh + 4 , { width: 165, align: "left" });
doc.text(`${invoice.locatie.account}`, 395 + 5 , 100+rh + 1 , { width: 165, align: "left" });


//Titlu factura
// '+20'
let yy = 130

doc.roundedRect(185, yy + 30, 200, 54, 1)
doc.lineWidth(0.8);
doc.stroke()
// doc.font('Courier')
doc.fontSize(24)
doc.font('public/font/Montserrat-Bold.ttf')
doc.text('FACTURĂ', 218, yy)
doc.fontSize(8)
doc.font("public/font/Montserrat-Regular.ttf");
doc.text('Serie/Nr.', 215, yy + 37, { width: 40, align: "left" })
doc.text('Emisă', 215, yy + 52, { width: 40, align: "left" })
doc.text('Scadentă', 215, yy + 67, { width: 40, align: "left" })

// Titlu Factura Date
doc.font('public/font/Montserrat-Bold.ttf')
doc.fontSize(9)
doc.text(`${invoice.invoiceNumber}`, 260, yy + 35)
doc.text(`${invoice.issueDate}`, 260, yy + 50)
doc.text(`${invoice.dueDate}`, 260, yy + 65)


let rectStartH = 267
let rectHeigth = 630
let headerHeight = 220
// radare produse
y = 257
let heghtValue = 12

// doc.font("Courier");
doc.fontSize(9)
let productsCount = invoice.products.length
let rowHeigth = 12

let firstChunk = 0
let restChunks = 52
let secondIndex = 30

if(productsCount <= 30){
  secondIndex = 26
  firstChunk = 26
}

if(productsCount > 30 && productsCount <= 39){
  firstChunk = 30
  restChunks = 52
}
if(productsCount > 39 && productsCount <= 100){
  secondIndex = 38
  firstChunk = 38
  restChunks = 47
}

if(productsCount > 100){
  secondIndex = 38
  firstChunk = 38
  restChunks = 52
}



 

let ingChunks = splitIngredients(invoice.products, firstChunk, restChunks)




let pages = ingChunks.length

let pageCount = ingChunks.length
if(ingChunks[ingChunks.length -1].length > firstChunk || (ingChunks[ingChunks.length -1].length > restChunks) && ingChunks.length === 1 ) {
    pageCount = pageCount + 1
}

ingChunks.forEach((ch, i) => {
    doc = addIngredients(doc, ch, rowHeigth, y, i+1, headerHeight, rectHeigth, rectStartH, heghtValue, pages, invoice.taxExclusiveAmount, invoice.taxInclusiveAmount, invoice.vatAmount, pageCount, value, secondIndex)
})



return doc

}



function addIngredients(doc, ch, rowHeigth, y, page, headerHeight, rectHeigth, rectStartH, heghtValue, pageLenght, taxExclusiveAmount, taxInclusiveAmount, vatAmount, pageCount, value, secondIndex){
     doc.fillColor('black') 


     if(page !== 1) {
        y = y - 160
        headerHeight = headerHeight - 160
        rectStartH = rectStartH - 160
      }  else {
        rectHeigth = rectHeigth - 150
     }
     let index = 1
     if(page === 2) index = 1 + secondIndex
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
      const name = el.name.replace(/\n/g, ' ') 
      if(name.length > 40) {
        doc.fontSize(7)
      } else {
        doc.fontSize(9)

      }
      let newValue = y + heghtValue
        doc.text(`${i + index}`, 26, newValue, { width: 17, align: "center" })
        doc.text(`${name}`, 47, newValue, { width: 225, align: 'left' })
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
        if(el.description?.length){
          console.log(el.name, ' ', el.description)
          doc.fontSize(6)
          doc.text(`${el.description.replace(/\n/g, '')}`, 49, newValue + 12, { width: 225, align: "left" })
          heghtValue += 12
          if(el.description.length > 70){
            heghtValue += 8
          }
          doc.fontSize(9)
        }
        heghtValue += rowHeigth
        // if(name.length > 40){
        //   heghtValue += 5
        // }
        if(name.length > 70){
          heghtValue += 5
        }
        if(name.length > 120){
          heghtValue += 5
        }
    })
    let pageWidth = doc.page.width;
    let pageHeight = doc.page.height;


    if(page < pageLenght){
      doc.fontSize(7)
        .fillColor('gray')
        .text(`Pagina ${page} din ${pageCount}`, pageWidth / 2 - 40, pageHeight - 90);
      doc.addPage({
        size: "A4",
        layout: "portrait",
      })
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



module.exports = {createNirInvoice}