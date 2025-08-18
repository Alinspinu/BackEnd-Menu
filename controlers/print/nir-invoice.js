const PDFDocument = require("pdfkit");

const {round} = require('../../utils/functions')

function createNirInvoice(invoice){

  const doc = new PDFDocument({
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
doc.text(`C.I.F.`, 25 + 10, 50, { width: 30, align: "left" });

doc.font("public/font/Montserrat-Regular.ttf");
doc.text(`Banca`, 25 + 10, 62, { width: 50, align: "left" })
doc.text(`Cont`, 25 + 10, 74, { width: 50, align: "left" })

//date firma

doc.fontSize(10);
// doc.font('Courier')
doc.text(`${invoice.supplier.vatNumber}`, 130 + 10, 50);


doc.text(`${invoice.supplier.bank}`, 60 + 10, 62)
doc.text(`${invoice.supplier.iban}`, 55 + 10, 74)

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

doc.roundedRect(210, 220, 150, 54, 1)
doc.lineWidth(0.8);
doc.stroke()
// doc.font('Courier')
doc.fontSize(24)
doc.font('public/font/Montserrat-Bold.ttf')
doc.text('FACTURĂ', 228, 190)
doc.fontSize(8)
doc.font("public/font/Montserrat-Regular.ttf");
doc.text('Serie/Nr.', 230, 192 + 35, { width: 40, align: "left" })
doc.text('Emisă', 230, 207 + 35, { width: 40, align: "left" })
doc.text('Scadentă', 230, 222 + 35, { width: 40, align: "left" })

// Titlu Factura Date
doc.font('public/font/Montserrat-Bold.ttf')
doc.fontSize(9)
doc.text(`${invoice.invoiceNumber}`, 275, 190 + 35)
doc.text(`${invoice.issueDate}`, 275, 205 + 35)
doc.text(`${invoice.dueDate}`, 275, 220 + 35)

//header produsex
doc.rect(25, 280, 18, 30)
doc.lineWidth(0.5);
doc.stroke()

doc.font("public/font/Montserrat-Regular.ttf");
doc.fontSize(9)
doc.text('Nr.', 26, 281)
doc.text('crt.', 26, 296)

doc.rect(43, 280, 230, 30)
doc.lineWidth(0.5);
doc.stroke()

doc.text('Denumirea produselor si serviciilor', 44, 293, { width: 228, align: "center" })

doc.rect(273, 280, 30, 30)
doc.lineWidth(0.5);
doc.stroke()

doc.text('U.M.', 275, 293, { width: 28, align: "center" })

doc.rect(303, 280, 60, 30)
doc.lineWidth(0.5);
doc.stroke()

doc.text('Cantitate', 305, 293, { width: 58, align: "center" })

doc.rect(363, 280, 60, 30)
doc.lineWidth(0.5);
doc.stroke()

doc.text('Pret unitar', 365, 287, { width: 58, align: "center" })
doc.text('fara T.V.A.', 365, 299, { width: 58, align: "center" })

doc.rect(423, 280, 60, 30)
doc.lineWidth(0.5);
doc.stroke()

doc.text('Valoare', 425, 287, { width: 58, align: "center" })
doc.text('fara T.V.A.', 425, 299, { width: 58, align: "center" })

doc.rect(483, 280, 77, 30)
doc.lineWidth(0.5);
doc.stroke()

doc.text('T.V.A.', 485, 285, { width: 75, align: "center" })
doc.text('Cota', 485, 299, { width: 35, align: "left" })
doc.text('Valoare', 521, 299, { width: 38, align: "right" })

//little header
doc.rect(25, 311, 18, 15)
doc.lineWidth(0.5);
doc.stroke()

doc.text('0', 26, 315, { width: 17, align: "center" })

doc.rect(43, 311, 230, 15)
doc.lineWidth(0.5);
doc.stroke()

doc.text('1', 44, 315, { width: 228, align: "center" })

doc.rect(273, 311, 30, 15)
doc.lineWidth(0.5);
doc.stroke()

doc.text('2', 274, 315, { width: 28, align: "center" })

doc.rect(303, 311, 60, 15)
doc.lineWidth(0.5);
doc.stroke()

doc.text('3', 304, 315, { width: 58, align: "center" })

doc.rect(363, 311, 60, 15)
doc.lineWidth(0.5);
doc.stroke()

doc.text('4', 364, 315, { width: 58, align: "center" })

doc.rect(423, 311, 60, 15)
doc.lineWidth(0.5);
doc.stroke()

doc.text('5 = 3 x 4', 424, 315, { width: 58, align: "center" })

doc.rect(483, 311, 77, 15)
doc.lineWidth(0.5);
doc.stroke()

doc.text('6', 484, 315, { width: 75, align: "center" })


//Body produse
doc.rect(25, 327, 18, 330)
doc.lineWidth(0.5);
doc.stroke()

doc.rect(43, 327, 230, 330)
doc.lineWidth(0.5);
doc.stroke()

doc.rect(273, 327, 30, 330)
doc.lineWidth(0.5);
doc.stroke()

doc.rect(303, 327, 60, 330)
doc.lineWidth(0.5);
doc.stroke()

doc.rect(363, 327, 60, 330)
doc.lineWidth(0.5);
doc.stroke()

doc.rect(423, 327, 60, 330)
doc.lineWidth(0.5);
doc.stroke()

doc.rect(483, 327, 77, 330)
doc.lineWidth(0.5);
doc.stroke()
// radare produse
y = 317
let heghtValue = 12
// doc.font("Courier");
doc.fontSize(9)
const productsCount = invoice.products.length
let rowHeigth = 14

if(productsCount >= 25 && productsCount <= 40){
  doc.fontSize(8)
  rowHeigth = 10
}
if(productsCount >= 41 && productsCount <= 50){
  doc.fontSize(6)
  rowHeigth = 8
}
if(productsCount > 50){
  doc.fontSize(5)
  rowHeigth = 7
}

console.log(invoice.products)

invoice.products.forEach((el, i) => {
  if(el.name.length > 30){
    el.name = el.name.slice(0, 40)
  }
    let newValue = y + heghtValue
    doc.text(`${i + 1}`, 26, newValue, { width: 17, align: "center" })
    doc.text(`${el.name}`, 47, newValue, { width: 225, align: 'left' })
    doc.text(`Buc`, 274, newValue, { width: 28, align: "center" })
    doc.text(`${el.quantity}.00`, 304, newValue, { width: 58, align: "center" })
    doc.text(`${round(el.totalNoVat/el.quantity)}`, 364, newValue, { width: 58, align: "center" })
    doc.text(`${round(el.totalNoVat)}`, 424, newValue, { width: 58, align: "center" })
    doc.text(`${el.vatPrecent}%`, 486, newValue, { width: 35, align: "left" })
    doc.text(`${round((el.price * el.quantity) - el.totalNoVat)}`, 523, newValue, { width: 30, align: "right" })
    heghtValue += rowHeigth
})

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
doc.text(`${round(invoice.taxExclusiveAmount)} Lei`, 365, 678, { width: 90, align: 'center' })
doc.text(`${round(invoice.vatAmount)} Lei`, 480, 678, { width: 75, align: 'center' })

doc.fontSize(16)
doc.text('TOTAL', 365, 745, { width: 90, align: 'center' })
doc.text(`${round(invoice.taxInclusiveAmount)} Lei`, 464, 745, { width: 90, align: 'center' })

return doc

}

module.exports = {createNirInvoice}