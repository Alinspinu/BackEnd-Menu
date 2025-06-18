const PDFDocument = require("pdfkit");


function createRecipt(recipt, mode){

  let description = recipt.description
  if(recipt.invoice.length) {
    let textArray = []
    for(let inv of recipt.invoice){
      textArray.push(inv.invoiceNumber +  ' din ' + inv.issueDate)
    }
    let singular = recipt.invoice.length === 1 ? 'factură' : 'facturi'
    description =`CV ${singular}: ${textArray.join(' / ')}`
  }

  const doc = new PDFDocument({
    size: mode ? 'A5' : "A4",
    layout: mode ? 'landscape' :  "portrait",
});


  let height = 45

  doc.rect(35, height, 525, 250)
  doc.lineWidth(1.1);
  doc.stroke()

  doc.fontSize(12)
  doc.font('public/font/Montserrat-Bold.ttf')
  doc.text(`S.C. ${recipt.locatie.bussinessName}`, 40, height + 5)
  doc.fontSize(10)
  doc.font('public/font/Montserrat-Regular.ttf')
  doc.text(`CIF  ${recipt.locatie.vatNumber}`, 40, height + 25)
  doc.text(`R.C.   ${recipt.locatie.register}`, 40, height + 37)
  doc.text(`Capital Social 200 lei`, 40, height + 49)
  doc.text(`Adresă`, 40, height + 61)
  doc.fontSize(8)
  doc.text(`${recipt.locatie.address}`, 40, height + 73, {width: 200, align: 'left'})
  doc.fontSize(10)
  doc.text(`Banca ${recipt.locatie.bank}`, 40, height + 93)
  doc.text(`Cont ${recipt.locatie.account}`, 40, height + 105)

  doc.fontSize(20)
  doc.font('public/font/Montserrat-Bold.ttf')
  doc.text('CHITANȚĂ', 350, height + 35)
  doc.fontSize(10)
  doc.font('public/font/Montserrat-Regular.ttf')
  doc.text('Serie', 340, height + 70)
  doc.text('Număr', 405, height + 70)
  doc.text('Data', 340, height + 86)
  doc.fontSize(11)
  doc.font('public/font/Montserrat-Bold.ttf')
  doc.text(`${recipt.serie}`, 370, height + 70)
  doc.text(`${recipt.number.toString().padStart(4, '0')}`, 445, height + 70)
  doc.text(`${formatedDateToShow(recipt.issueDate).split('ora')[0]}`, 370, height + 85)

  height = height + 120

  doc.lineWidth(0.6);
  doc.moveTo(35, height)
     .lineTo(560, height)
     .stroke();
  
    doc.fontSize(10)
    doc.font('public/font/Montserrat-Regular.ttf')
    doc.text('Am primit de la', 40, height + 6)
    doc.text(`CIF  ${recipt.client.customer.vatNumber}`, 40, height + 19)
    doc.text(`R.C.   ${recipt.client.customer.register}`, 40, height + 31)
    doc.text('Adresă:', 40, height + 19 + 24)
    doc.text('Suma de', 40, height + 46 + 18)
    doc.text('Adică', 40, height + 58 + 20)
    doc.text(`Reprezentând`, 40, height + 72 +20)
    doc.fontSize(9)
    doc.text(`${description}`, 115, height + 72 +20, {width: 338, align: 'left'})

    doc.fontSize(7)
    doc.text(`${recipt.client.customer.address}`, 80, height + 22 +24, {width: 353, align: 'left'})
    doc.fontSize(11)
    doc.font('public/font/Montserrat-Bold.ttf')
    doc.text(`${recipt.client.name}`, 124, height + 5)
    doc.fontSize(10)
    doc.text(`${numarInLitereCompactCuLeiBani(recipt.value)}`, 70, height + 58 +20)
    doc.fontSize(16)
    doc.text(`${recipt.value} Lei`, 90, height + 40 + 18)

    doc.dash(3, { space: 3 });
    doc.lineWidth(0.6);
    doc.moveTo(445, height)
       .lineTo(445, height + 130)
       .stroke();
    doc.lineWidth(0.6);
        doc.moveTo(445, height + 80)
        .lineTo(560, height + 80)
        .stroke();
    doc.undash();
    doc.image('public/icons/logo_true1.png', 460, height + 15, {width: 80})
    doc.fontSize(8)
    doc.font('public/font/Montserrat-Regular.ttf')
    doc.text('Semnătură', 455, height + 85)


  height = height + 260 - 120
  doc.dash(2, { space: 2 });
  doc.lineWidth(0.8);
  doc.moveTo(20, height)
     .lineTo(575, height)
     .stroke();
  doc.undash();

  if(!mode){
  height = height + 10
  doc.rect(35, height, 525, 250)
  doc.lineWidth(1.1);
  doc.stroke()

  doc.rect(35, height, 525, 250)
  doc.lineWidth(1.1);
  doc.stroke()

  doc.fontSize(12)
  doc.font('public/font/Montserrat-Bold.ttf')
  doc.text(`S.C. ${recipt.locatie.bussinessName}`, 40, height + 5)
  doc.fontSize(10)
  doc.font('public/font/Montserrat-Regular.ttf')
  doc.text(`CIF  ${recipt.locatie.vatNumber}`, 40, height + 25)
  doc.text(`R.C.   ${recipt.locatie.register}`, 40, height + 37)
  doc.text(`Capital Social 200 lei`, 40, height + 49)
  doc.text(`Adresă`, 40, height + 61)
  doc.fontSize(8)
  doc.text(`${recipt.locatie.address}`, 40, height + 73, {width: 200, align: 'left'})
  doc.fontSize(10)
  doc.text(`Banca ${recipt.locatie.bank}`, 40, height + 93)
  doc.text(`Cont ${recipt.locatie.account}`, 40, height + 105)

  doc.fontSize(20)
  doc.font('public/font/Montserrat-Bold.ttf')
  doc.text('CHITANȚĂ', 350, height + 35)
  doc.fontSize(10)
  doc.font('public/font/Montserrat-Regular.ttf')
  doc.text('Serie', 340, height + 70)
  doc.text('Număr', 405, height + 70)
  doc.text('Data', 340, height + 86)
  doc.fontSize(11)
  doc.font('public/font/Montserrat-Bold.ttf')
  doc.text(`${recipt.serie}`, 370, height + 70)
  doc.text(`${recipt.number.toString().padStart(4, '0')}`, 445, height + 70)
  doc.text(`${formatedDateToShow(recipt.issueDate).split('ora')[0]}`, 370, height + 85)

  height = height + 120

  doc.lineWidth(0.6);
  doc.moveTo(35, height)
     .lineTo(560, height)
     .stroke();
  
    doc.fontSize(10)
    doc.font('public/font/Montserrat-Regular.ttf')
    doc.text('Am primit de la', 40, height + 6)
    doc.text(`CIF  ${recipt.client.customer.vatNumber}`, 40, height + 19)
    doc.text(`R.C.   ${recipt.client.customer.register}`, 40, height + 31)
    doc.text('Adresă:', 40, height + 19 + 24)
    doc.text('Suma de', 40, height + 46 + 18)
    doc.text('Adică', 40, height + 58 + 20)
    doc.text(`Reprezentând`, 40, height + 72 +20)
    doc.fontSize(9)
    doc.text(`${description}`, 115, height + 72 +20, {width: 338, align: 'left'})

    doc.fontSize(7)
    doc.text(`${recipt.client.customer.address}`, 80, height + 22 +24, {width: 353, align: 'left'})
    doc.fontSize(11)
    doc.font('public/font/Montserrat-Bold.ttf')
    doc.text(`${recipt.client.name}`, 124, height + 5)
    doc.fontSize(10)
    doc.text(`${numarInLitereCompactCuLeiBani(recipt.value)}`, 70, height + 58 +20)
    doc.fontSize(16)
    doc.text(`${recipt.value} Lei`, 90, height + 40 + 18)

    doc.dash(3, { space: 3 });
    doc.lineWidth(0.6);
    doc.moveTo(445, height)
       .lineTo(445, height + 130)
       .stroke();
    doc.lineWidth(0.6);
        doc.moveTo(445, height + 80)
        .lineTo(560, height + 80)
        .stroke();
    doc.undash();
    doc.image('public/icons/logo_true1.png', 460, height + 15, {width: 80})
    doc.fontSize(8)
    doc.font('public/font/Montserrat-Regular.ttf')
    doc.text('Semnătură', 455, height + 85)


  height = height + 260 -120
  doc.dash(2, { space: 2 });
  doc.lineWidth(0.8);
  doc.moveTo(20, height)
     .lineTo(575, height)
     .stroke();
  doc.undash();

  }

  return doc
}



function numarInLitereCompactCuLeiBani(input) {
  input = input.toString().replace(',', '.');
  let [intPart, fracPart] = input.split('.');

  intPart = parseInt(intPart, 10);
  fracPart = parseInt((fracPart || '0').padEnd(2, '0').slice(0, 2), 10); // max 2 cifre

  const numarInLitere = (n) => {
    const unitati = ['', 'unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă'];
    const zeci = ['', 'zece', 'douăzeci', 'treizeci', 'patruzeci', 'cincizeci', 'șaizeci', 'șaptezeci', 'optzeci', 'nouăzeci'];
    const speciale = ['zece', 'unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece', 'șaisprezece', 'șaptesprezece', 'optsprezece', 'nouăsprezece'];

    if (n === 0) return 'zero';
    let litere = '';

    if (n >= 1000) {
      let mii = Math.floor(n / 1000);
      litere += (mii === 1 ? 'omie' : (mii === 2 ? 'douămii' : `${numarInLitere(mii)}mii`));
      n %= 1000;
    }

    if (n >= 100) {
      let sute = Math.floor(n / 100);
      litere += (sute === 1 ? 'osută' : `${unitati[sute]}sute`);
      n %= 100;
    }

    if (n >= 20) {
      let z = Math.floor(n / 10);
      litere += zeci[z];
      n %= 10;
      if (n > 0) litere += 'și' + unitati[n];
    } else if (n >= 10) {
      litere += speciale[n - 10];
    } else if (n > 0) {
      litere += unitati[n];
    }

    return litere;
  };

  let rezultat = numarInLitere(intPart) + 'lei';
  if (fracPart > 0) {
    rezultat += 'și' + numarInLitere(fracPart) + 'bani';
  }

  return rezultat;
}


module.exports = {createRecipt}